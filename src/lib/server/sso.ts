import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { dev } from '$app/environment';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

/**
 * CTU Accounts single sign-on bridge.
 *
 * 1. The browser sends the shared `ctu.session_token` cookie (scoped to .ctu-moalboal.online).
 * 2. We forward only the CTU cookies to Accounts' Better Auth `get-session` endpoint.
 * 3. The SSO email must match a row in `profiles` that an AACCUP admin added.
 * 4. We sign a short-lived Supabase JWT for that profile, so the existing RLS policies,
 *    workflow RPCs and area-chair limits apply unchanged.
 */

export const STAFF_ROLES = ['admin', 'focal', 'reviewer', 'area_chair'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export type SsoUser = { id: string; email: string; name: string; image: string | null };

export type StaffProfile = {
	id: string;
	email: string;
	full_name: string | null;
	role: StaffRole;
	program_id: string | null;
	area_id: string | null;
};

export function accountsUrl(): string {
	return (privateEnv.ACCOUNTS_URL || 'https://accounts.ctu-moalboal.online').replace(/\/$/, '');
}

export function ssoLoginUrl(returnTo: string): string {
	return `${accountsUrl()}/login?callbackUrl=${encodeURIComponent(returnTo)}`;
}

export function ssoLogoutUrl(): string {
	return `${accountsUrl()}/logout`;
}

/** Only CTU session cookies leave this site; Supabase or other cookies are never forwarded. */
function ctuCookies(cookieHeader: string | null): string {
	if (!cookieHeader) return '';
	return cookieHeader
		.split(';')
		.map((part) => part.trim())
		.filter((part) => /^(__Secure-)?ctu\./.test(part))
		.join('; ');
}

/**
 * The Accounts round trip is the slowest part of an admin request, so a confirmed SSO
 * identity is remembered for a short time in a signed httpOnly cookie. The cache is bound
 * to the current CTU session token: signing out of CTU Accounts (which clears that cookie)
 * or switching accounts invalidates it at once. Only a session revoked remotely in Accounts
 * can stay valid here for up to SSO_CACHE_SECONDS. AACCUP access itself (the profile) is
 * still checked on every request.
 */
const SSO_CACHE_COOKIE = 'aaccup_sso';
const SSO_CACHE_SECONDS = 120;

type SsoCache = SsoUser & { tok: string; exp: number };

const textEncoder = new TextEncoder();
const toB64url = (bytes: ArrayBuffer | Uint8Array) => {
	let binary = '';
	for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64url = (value: string) => atob(value.replace(/-/g, '+').replace(/_/g, '/'));

let cacheKey: Promise<CryptoKey> | null = null;

/** HMAC key derived from the service-role key, so no extra secret is needed. */
function signingKey(): Promise<CryptoKey> | null {
	const secret = privateEnv.SUPABASE_SERVICE_ROLE_KEY;
	if (!secret) return null;
	cacheKey ??= crypto.subtle
		.digest('SHA-256', textEncoder.encode(`aaccup-sso-cache|${secret}`))
		.then((raw) => crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']));
	return cacheKey;
}

/** A short fingerprint of the CTU session token, so the cache follows that exact session. */
async function sessionFingerprint(cookieHeader: string): Promise<string | null> {
	const token = cookieHeader
		.split('; ')
		.find((part) => /^(__Secure-)?ctu\.session_token=/.test(part));
	if (!token) return null;
	return toB64url(await crypto.subtle.digest('SHA-256', textEncoder.encode(token))).slice(0, 32);
}

async function readSsoCache(cookies: Cookies, fingerprint: string): Promise<SsoUser | null> {
	const raw = cookies.get(SSO_CACHE_COOKIE);
	const key = signingKey();
	if (!raw || !key) return null;

	try {
		const [body, signature] = raw.split('.');
		const valid = await crypto.subtle.verify(
			'HMAC',
			await key,
			Uint8Array.from(fromB64url(signature), (c) => c.charCodeAt(0)),
			textEncoder.encode(body)
		);
		if (!valid) return null;

		const cache = JSON.parse(fromB64url(body)) as SsoCache;
		if (cache.tok !== fingerprint || cache.exp < Math.floor(Date.now() / 1000)) return null;
		return { id: cache.id, email: cache.email, name: cache.name, image: cache.image };
	} catch {
		return null;
	}
}

async function writeSsoCache(cookies: Cookies, user: SsoUser, fingerprint: string) {
	const key = signingKey();
	if (!key) return;
	const cache: SsoCache = { ...user, tok: fingerprint, exp: Math.floor(Date.now() / 1000) + SSO_CACHE_SECONDS };
	const body = toB64url(textEncoder.encode(JSON.stringify(cache)));
	const signature = toB64url(await crypto.subtle.sign('HMAC', await key, textEncoder.encode(body)));
	cookies.set(SSO_CACHE_COOKIE, `${body}.${signature}`, {
		path: '/',
		httpOnly: true,
		secure: !dev,
		sameSite: 'lax',
		maxAge: SSO_CACHE_SECONDS
	});
}

async function fetchSsoUser(cookie: string): Promise<SsoUser | null> {
	try {
		const response = await fetch(`${accountsUrl()}/api/auth/get-session`, {
			headers: { cookie, accept: 'application/json' },
			signal: AbortSignal.timeout(5000)
		});
		if (!response.ok) return null;

		const body = (await response.json()) as {
			user?: { id?: string; email?: string; name?: string; image?: string | null; banned?: boolean };
		} | null;
		const user = body?.user;
		if (!user?.id || !user.email || user.banned) return null;

		return { id: user.id, email: user.email.toLowerCase(), name: user.name ?? user.email, image: user.image ?? null };
	} catch {
		return null;
	}
}

export async function getSsoUser(request: Request, cookies: Cookies): Promise<SsoUser | null> {
	// Local development cannot receive the .ctu-moalboal.online cookie on localhost.
	// `dev` is false in production builds, so this override never ships.
	if (dev && privateEnv.AACCUP_DEV_SSO_EMAIL) {
		const email = privateEnv.AACCUP_DEV_SSO_EMAIL.toLowerCase();
		return { id: `dev:${email}`, email, name: email, image: null };
	}

	const cookie = ctuCookies(request.headers.get('cookie'));
	const fingerprint = cookie ? await sessionFingerprint(cookie) : null;
	if (!cookie || !fingerprint) {
		if (cookies.get(SSO_CACHE_COOKIE)) cookies.delete(SSO_CACHE_COOKIE, { path: '/' });
		return null;
	}

	const cached = await readSsoCache(cookies, fingerprint);
	if (cached) return cached;

	const user = await fetchSsoUser(cookie);
	if (user) await writeSsoCache(cookies, user, fingerprint);
	else if (cookies.get(SSO_CACHE_COOKIE)) cookies.delete(SSO_CACHE_COOKIE, { path: '/' });
	return user;
}

let serviceClient: SupabaseClient | null = null;

/** Server-only client. Used for the profile lookup and user provisioning, never sent to the browser. */
export function supabaseService(): SupabaseClient | null {
	if (!publicEnv.PUBLIC_SUPABASE_URL || !privateEnv.SUPABASE_SERVICE_ROLE_KEY) return null;
	serviceClient ??= createClient(publicEnv.PUBLIC_SUPABASE_URL, privateEnv.SUPABASE_SERVICE_ROLE_KEY, {
		auth: { persistSession: false, autoRefreshToken: false }
	});
	return serviceClient;
}

export function supabaseAnon(): SupabaseClient | null {
	if (!publicEnv.PUBLIC_SUPABASE_URL || !publicEnv.PUBLIC_SUPABASE_ANON_KEY) return null;
	return createClient(publicEnv.PUBLIC_SUPABASE_URL, publicEnv.PUBLIC_SUPABASE_ANON_KEY, {
		auth: { persistSession: false, autoRefreshToken: false }
	});
}

export async function findStaffProfile(email: string): Promise<StaffProfile | null> {
	const service = supabaseService();
	if (!service) return null;

	const { data } = await service
		.from('profiles')
		.select('id, email, full_name, role, program_id, area_id')
		// Exact match on the lowercased email. Never ilike: `_` and `%` would act as wildcards.
		.eq('email', email.toLowerCase())
		.maybeSingle();

	return data && STAFF_ROLES.includes(data.role) ? (data as StaffProfile) : null;
}

/**
 * Staff sessions are real Supabase Auth sessions, so tokens are signed by the project's own
 * keys (currently ES256) and survive key rotation. After the SSO check, the server asks
 * Supabase for a one-time login link for the staff email (generateLink sends no email) and
 * redeems it immediately. The session is kept in an httpOnly cookie and refreshed when it
 * expires or when the person's role changes.
 */

const SESSION_COOKIE = 'aaccup_staff_session';

type StoredSession = { email: string; access_token: string; refresh_token: string; expires_at: number };

type Cookies = {
	get(name: string): string | undefined;
	set(name: string, value: string, options: { path: string; httpOnly?: boolean; secure?: boolean; sameSite?: 'lax'; maxAge?: number }): void;
	delete(name: string, options: { path: string }): void;
};

function claims(token: string): { app_metadata?: Record<string, unknown> } {
	try {
		return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
	} catch {
		return {};
	}
}

/** The token's role/program/area must match the profile; otherwise refresh to pick up changes. */
function claimsMatch(token: string, profile: StaffProfile): boolean {
	const meta = claims(token).app_metadata ?? {};
	return (
		meta.role === profile.role &&
		(meta.program_id ?? null) === profile.program_id &&
		(meta.area_id ?? null) === profile.area_id
	);
}

function readSession(cookies: Cookies, email: string): StoredSession | null {
	try {
		const raw = cookies.get(SESSION_COOKIE);
		const session = raw ? (JSON.parse(raw) as StoredSession) : null;
		return session?.email === email ? session : null;
	} catch {
		return null;
	}
}

function saveSession(cookies: Cookies, email: string, session: { access_token: string; refresh_token: string; expires_at?: number }) {
	cookies.set(
		SESSION_COOKIE,
		JSON.stringify({
			email,
			access_token: session.access_token,
			refresh_token: session.refresh_token,
			expires_at: session.expires_at ?? Math.floor(Date.now() / 1000) + 3600
		} satisfies StoredSession),
		{ path: '/', httpOnly: true, secure: !dev, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7 }
	);
}

export function clearStaffSession(cookies: Cookies) {
	if (cookies.get(SESSION_COOKIE)) cookies.delete(SESSION_COOKIE, { path: '/' });
}

function clientWithToken(token: string): SupabaseClient {
	return createClient(publicEnv.PUBLIC_SUPABASE_URL!, publicEnv.PUBLIC_SUPABASE_ANON_KEY!, {
		auth: { persistSession: false, autoRefreshToken: false },
		global: { headers: { Authorization: `Bearer ${token}` } }
	});
}

/** A Supabase client that acts as this staff member under RLS, or null when it cannot sign in. */
export async function supabaseAsStaff(profile: StaffProfile, cookies: Cookies): Promise<SupabaseClient | null> {
	const anon = supabaseAnon();
	const service = supabaseService();
	if (!anon || !service) return null;

	const stored = readSession(cookies, profile.email);
	const now = Math.floor(Date.now() / 1000);

	if (stored && stored.expires_at - 60 > now && claimsMatch(stored.access_token, profile)) {
		return clientWithToken(stored.access_token);
	}

	// Expired, or the role changed: a refresh returns a token with the current app_metadata.
	if (stored) {
		const { data } = await anon.auth.refreshSession({ refresh_token: stored.refresh_token });
		if (data.session && claimsMatch(data.session.access_token, profile)) {
			saveSession(cookies, profile.email, data.session);
			return clientWithToken(data.session.access_token);
		}
	}

	// No usable session: issue a fresh one for the invited email.
	const { data: link, error: linkError } = await service.auth.admin.generateLink({ type: 'magiclink', email: profile.email });
	if (linkError || !link.properties?.hashed_token) {
		console.error('AACCUP staff session: generateLink failed', linkError?.message);
		return null;
	}

	const { data, error } = await anon.auth.verifyOtp({ type: 'email', token_hash: link.properties.hashed_token });
	if (error || !data.session) {
		console.error('AACCUP staff session: verifyOtp failed', error?.message);
		return null;
	}

	saveSession(cookies, profile.email, data.session);
	return clientWithToken(data.session.access_token);
}
