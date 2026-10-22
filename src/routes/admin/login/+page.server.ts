import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { ssoLoginUrl } from '$lib/server/sso';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const next = url.searchParams.get('next') || '/admin';
	const origin = (publicEnv.PUBLIC_SITE_URL || url.origin).replace(/\/$/, '');
	// Only same-site paths survive the round trip through Accounts.
	const returnTo = `${origin}${next.startsWith('/') && !next.startsWith('//') ? next : '/admin'}`;

	return {
		loginUrl: ssoLoginUrl(returnTo),
		// Signed in to CTU Accounts, but not on the AACCUP list.
		notListed: locals.ssoUser ? { email: locals.ssoUser.email, name: locals.ssoUser.name } : null,
		configured: Boolean(
			publicEnv.PUBLIC_SUPABASE_URL && privateEnv.SUPABASE_SERVICE_ROLE_KEY && privateEnv.SUPABASE_JWT_SECRET
		)
	};
};
