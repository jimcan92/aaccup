import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { profile } = await parent();

	if (!locals.supabase) {
		redirect(303, '/admin/login');
	}

	const [blocks, areas, documents, recent] = await Promise.all([
		locals.supabase.from('content_blocks').select('*', { count: 'exact', head: true }),
		locals.supabase.from('areas').select('*', { count: 'exact', head: true }),
		locals.supabase.from('documents').select('*', { count: 'exact', head: true }),
		locals.supabase
			.from('content_blocks')
			.select('key, label, group_name, status, updated_at')
			.order('updated_at', { ascending: false })
			.limit(6)
	]);

	return {
		profile,
		counts: {
			blocks: blocks.count ?? 0,
			areas: areas.count ?? 0,
			documents: documents.count ?? 0
		},
		recent: recent.data ?? []
	};
};
