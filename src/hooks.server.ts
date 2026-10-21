import { createServerClient } from '@supabase/ssr';
import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';

export const handle: Handle = async ({ event, resolve }) => {
	const url = env.PUBLIC_SUPABASE_URL;
	const key = env.PUBLIC_SUPABASE_ANON_KEY;

	event.locals.supabase =
		url && key
			? createServerClient(url, key, {
					cookies: {
						getAll: () => event.cookies.getAll(),
						setAll: (cookiesToSet) => {
							cookiesToSet.forEach(({ name, value, options }) => {
								event.cookies.set(name, value, { ...options, path: '/' });
							});
						}
					}
				})
			: null;

	event.locals.safeGetSession = async () => {
		if (!event.locals.supabase) {
			return { session: null, user: null };
		}

		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();

		if (!session) {
			return { session: null, user: null };
		}

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();

		if (error) {
			return { session: null, user: null };
		}

		return { session, user };
	};

	return resolve(event, {
		filterSerializedResponseHeaders: (name) => name === 'content-range'
	});
};
