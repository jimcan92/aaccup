import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { findStaffProfile, getSsoUser, supabaseAnon, supabaseAsStaff } from '$lib/server/sso';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = supabaseAnon();
	event.locals.ssoUser = null;
	event.locals.staff = null;

	// Only the admin and the draft preview need to know who is signing in.
	// Public pages stay anonymous and cacheable.
	// Nothing is signed in at build time, and prerendered pages must not read search params.
	const needsStaff =
		!building &&
		(event.url.pathname.startsWith('/admin') || event.url.searchParams.get('preview') === '1');

	if (needsStaff) {
		const ssoUser = await getSsoUser(event.request);
		event.locals.ssoUser = ssoUser;

		if (ssoUser) {
			const profile = await findStaffProfile(ssoUser.email);
			const client = profile ? await supabaseAsStaff(profile) : null;

			if (profile && client) {
				event.locals.staff = profile;
				event.locals.supabase = client;
			}
		}
	}

	return resolve(event, {
		filterSerializedResponseHeaders: (name) => name === 'content-range'
	});
};
