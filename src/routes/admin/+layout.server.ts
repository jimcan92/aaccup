import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const isLogin = url.pathname === '/admin/login' || url.pathname.startsWith('/admin/login/');

	if (!locals.supabase) {
		if (!isLogin) {
			redirect(303, '/admin/login');
		}

		return {
			configured: false,
			isLogin,
			session: null,
			user: null,
			profile: null
		};
	}

	const { session, user } = await locals.safeGetSession();

	if (!session && !isLogin) {
		const next = `${url.pathname}${url.search}`;
		redirect(303, `/admin/login?next=${encodeURIComponent(next)}`);
	}

	let profile = null;

	if (user) {
		const { data } = await locals.supabase
			.from('profiles')
			.select('id, email, full_name, role, program_id, area_id')
			.eq('id', user.id)
			.maybeSingle();

		profile = data;
	}

	if (!isLogin && (!profile || !['admin', 'focal', 'reviewer', 'area_chair'].includes(profile.role))) {
		redirect(303, '/');
	}

	if (isLogin && session) {
		redirect(303, '/admin');
	}

	return {
		configured: true,
		isLogin,
		session,
		user,
		profile
	};
};
