import type { Handle } from '@sveltejs/kit/hooks';
import { building } from '$app/env';

import {
	clearStaffSession,
	findStaffProfile,
	getSsoUser,
	supabaseAnon,
	supabaseAsStaff
} from '#lib/server/sso.js';

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
		const ssoUser = await getSsoUser(event.request, event.cookies);
		event.locals.ssoUser = ssoUser;

		if (ssoUser) {
			const profile = await findStaffProfile(ssoUser.email);
			const client = profile ? await supabaseAsStaff(profile, event.cookies) : null;

			if (profile && client) {
				event.locals.staff = profile;
				event.locals.supabase = client;
			}
		}

		// Signed out of CTU Accounts or removed from the list: drop the staff session too.
		if (!event.locals.staff) clearStaffSession(event.cookies);
	}

	const response = await resolve(event, {
		filterSerializedResponseHeaders: (name) => name === 'content-range'
	});

	// Only this site may frame its pages (the admin previews do); the rest are browser hardening.
	response.headers.set('X-Frame-Options', 'SAMEORIGIN');
	response.headers.set('Content-Security-Policy', "frame-ancestors 'self'");
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	return response;
};
