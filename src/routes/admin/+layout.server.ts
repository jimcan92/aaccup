import { redirect } from '@sveltejs/kit';
import { ssoLogoutUrl } from '#lib/server/sso.js';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const isLogin = url.pathname === '/admin/login';

	// Signed in and on the AACCUP list: the login page has nothing to do.
	if (isLogin && locals.staff) {
		redirect(303, url.searchParams.get('next') || '/admin');
	}

	if (!isLogin && !locals.staff) {
		redirect(303, `/admin/login?next=${encodeURIComponent(`${url.pathname}${url.search}`)}`);
	}

	// Every program, for the quick actions menu; RLS limits what each role can read.
	const { data: menuPrograms } = !isLogin && locals.supabase
		? await locals.supabase.from('programs').select('id, code, slug').order('sort_order')
		: { data: null };

	return {
		// Not "programs": page data with that name would replace it.
		menuPrograms: menuPrograms ?? [],
		isLogin,
		staff: locals.staff,
		ssoUser: locals.ssoUser,
		logoutUrl: ssoLogoutUrl()
	};
};
