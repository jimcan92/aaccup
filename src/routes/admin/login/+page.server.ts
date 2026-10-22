import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { ssoLoginUrl } from '$lib/server/sso';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const next = url.searchParams.get('next') || '/admin';
	const origin = (publicEnv.PUBLIC_SITE_URL || url.origin).replace(/\/$/, '');
	// Only same-site paths survive the round trip through Accounts.
	const returnTo = `${origin}${next.startsWith('/') && !next.startsWith('//') ? next : '/admin'}`;

	const configured = Boolean(
		publicEnv.PUBLIC_SUPABASE_URL &&
			publicEnv.PUBLIC_SUPABASE_ANON_KEY &&
			privateEnv.SUPABASE_SERVICE_ROLE_KEY
	);
	const missing = [
		['PUBLIC_SUPABASE_URL', publicEnv.PUBLIC_SUPABASE_URL],
		['PUBLIC_SUPABASE_ANON_KEY', publicEnv.PUBLIC_SUPABASE_ANON_KEY],
		['SUPABASE_SERVICE_ROLE_KEY', privateEnv.SUPABASE_SERVICE_ROLE_KEY]
	]
		.filter(([, value]) => !value)
		.map(([name]) => name as string);

	return {
		missing,
		loginUrl: ssoLoginUrl(returnTo),
		// Signed in to CTU Accounts, but not on the AACCUP list. Only meaningful when the
		// server can look people up; otherwise every user would look unlisted.
		notListed: configured && locals.ssoUser ? { email: locals.ssoUser.email, name: locals.ssoUser.name } : null,
		signedInAs: locals.ssoUser?.email ?? null,
		configured
	};
};
