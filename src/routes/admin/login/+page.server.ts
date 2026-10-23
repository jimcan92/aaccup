import { SUPABASE_SERVICE_ROLE_KEY } from '$app/env/private';

import {
	PUBLIC_SITE_URL,
	PUBLIC_SUPABASE_URL,
	PUBLIC_SUPABASE_ANON_KEY
} from '$app/env/public';

import { ssoLoginUrl } from '#lib/server/sso.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const next = url.searchParams.get('next') || '/admin';
	const origin = (PUBLIC_SITE_URL || url.origin).replace(/\/$/, '');
	// Only same-site paths survive the round trip through Accounts.
	const returnTo = `${origin}${next.startsWith('/') && !next.startsWith('//') ? next : '/admin'}`;

	const configured = Boolean(PUBLIC_SUPABASE_URL && PUBLIC_SUPABASE_ANON_KEY && SUPABASE_SERVICE_ROLE_KEY);

	const missing = [
		['PUBLIC_SUPABASE_URL', PUBLIC_SUPABASE_URL],
		['PUBLIC_SUPABASE_ANON_KEY', PUBLIC_SUPABASE_ANON_KEY],
		['SUPABASE_SERVICE_ROLE_KEY', SUPABASE_SERVICE_ROLE_KEY]
	].filter(([, value]) => !value).map(([name]) => name as string);

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
