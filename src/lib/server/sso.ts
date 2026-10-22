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

export async function getSsoUser(request: Request): Promise<SsoUser | null> {
	// Local development cannot receive the .ctu-moalboal.online cookie on localhost.
	// `dev` is false in production builds, so this override never ships.
	if (dev && privateEnv.AACCUP_DEV_SSO_EMAIL) {
		const email = privateEnv.AACCUP_DEV_SSO_EMAIL.toLowerCase();
		return { id: `dev:${email}`, email, name: email, image: null };
	}

	const cookie = ctuCookies(request.headers.get('cookie'));
	if (!cookie) return null;

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

const encoder = new TextEncoder();

function base64url(input: ArrayBuffer | Uint8Array | string): string {
	const bytes = typeof input === 'string' ? encoder.encode(input) : new Uint8Array(input);
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** HS256 JWT in the shape Supabase Auth issues, signed with the project's legacy JWT secret. */
async function signSupabaseJwt(profile: StaffProfile, secret: string): Promise<string> {
	const now = Math.floor(Date.now() / 1000);
	const header = { alg: 'HS256', typ: 'JWT' };
	const payload = {
		iss: 'aaccup-sso',
		aud: 'authenticated',
		role: 'authenticated',
		sub: profile.id,
		email: profile.email,
		iat: now,
		exp: now + 10 * 60,
		app_metadata: { role: profile.role, program_id: profile.program_id, provider: 'ctu-accounts' },
		user_metadata: { full_name: profile.full_name }
	};

	const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
	const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
	const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(unsigned));
	return `${unsigned}.${base64url(signature)}`;
}

/** A Supabase client that acts as this staff member under RLS. */
export async function supabaseAsStaff(profile: StaffProfile): Promise<SupabaseClient | null> {
	const secret = privateEnv.SUPABASE_JWT_SECRET;
	if (!publicEnv.PUBLIC_SUPABASE_URL || !publicEnv.PUBLIC_SUPABASE_ANON_KEY || !secret) return null;

	const token = await signSupabaseJwt(profile, secret);
	return createClient(publicEnv.PUBLIC_SUPABASE_URL, publicEnv.PUBLIC_SUPABASE_ANON_KEY, {
		auth: { persistSession: false, autoRefreshToken: false },
		global: { headers: { Authorization: `Bearer ${token}` } }
	});
}
