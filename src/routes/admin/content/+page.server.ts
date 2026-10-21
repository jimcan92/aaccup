import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.supabase) {
		redirect(303, '/admin/login');
	}

	const { data: blocks, error } = await locals.supabase
		.from('content_blocks')
		.select('id, key, label, group_name, type, status, draft_value, published_value, updated_at')
		.order('group_name', { ascending: true })
		.order('sort_order', { ascending: true });

	if (error) {
		return { blocks: [], error: error.message };
	}

	const groups = new Map<string, typeof blocks>();

	for (const block of blocks ?? []) {
		const list = groups.get(block.group_name) ?? [];
		list.push(block);
		groups.set(block.group_name, list);
	}

	return {
		groups: Array.from(groups.entries()).map(([name, items]) => ({ name, items })),
		error: null
	};
};
