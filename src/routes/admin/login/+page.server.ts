import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ url }) => {
	return {
		next: url.searchParams.get('next') || '/admin',
		error: url.searchParams.get('error')
	};
};

export const actions: Actions = {
	password: async ({ request, locals, url }) => {
		if (!locals.supabase) {
			return fail(500, { message: 'Supabase is not configured on this deployment.' });
		}

		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim();
		const password = String(form.get('password') ?? '');

		if (!email || !password) {
			return fail(400, { email, message: 'Email and password are required.' });
		}

		const { error } = await locals.supabase.auth.signInWithPassword({ email, password });

		if (error) {
			return fail(400, { email, message: error.message });
		}

		redirect(303, url.searchParams.get('next') || '/admin');
	},

	magic: async ({ request, locals, url }) => {
		if (!locals.supabase) {
			return fail(500, { message: 'Supabase is not configured on this deployment.' });
		}

		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim();

		if (!email) {
			return fail(400, { email, message: 'Enter your email first.' });
		}

		const next = url.searchParams.get('next') || '/admin';
		const redirectTo = `${url.origin}/auth/callback?next=${encodeURIComponent(next)}`;

		const { error } = await locals.supabase.auth.signInWithOtp({
			email,
			options: {
				emailRedirectTo: redirectTo,
				shouldCreateUser: false
			}
		});

		if (error) {
			return fail(400, { email, message: error.message });
		}

		return {
			email,
			success: `Magic link sent to ${email}. Check your inbox.`
		};
	}
};
