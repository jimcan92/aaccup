import { fail } from '@sveltejs/kit';
import { canManage, dbFail, requireStaff } from '#lib/server/admin.js';
import { canEditBlocks, landingActions, loadBlocks } from '#lib/server/landing-blocks.js';
import { ACTIVE_CONTENT_KEYS } from '#lib/data/site.js';
import type { Actions, PageServerLoad } from './$types';

// The home page's blocks are the ones with no program; its header and site texts are content blocks.
export const load: PageServerLoad = async ({ locals }) => {
	const { staff, supabase } = requireStaff(locals);
	const { data: texts } = await supabase
		.from('content_blocks')
		.select('id, key, draft_value, published_value, status')
		.in('key', [...ACTIVE_CONTENT_KEYS]);
	return {
		...(await loadBlocks(supabase, null)),
		texts: texts ?? [],
		canEdit: canEditBlocks(staff, null),
		canManage: canManage(staff)
	};
};

/** Save the posted texts as drafts; returns the ids of the texts in the form, or a failure. */
async function saveTexts(locals: App.Locals, form: FormData) {
	const { supabase } = requireStaff(locals, ['admin', 'focal']);
	const { data: rows, error: loadError } = await supabase.from('content_blocks').select('id, key, draft_value').in('key', [...ACTIVE_CONTENT_KEYS]);
	if (loadError) return { failure: dbFail(loadError) };

	const ids: string[] = [];
	for (const row of rows ?? []) {
		if (!form.has(row.key)) continue;
		ids.push(row.id);
		const value = String(form.get(row.key) ?? '').trim().slice(0, 2000);
		if (row.key === 'home.hero.title' && !value) return { failure: fail(400, { message: 'The heading cannot be empty.' }) };
		if (value === (row.draft_value ?? '')) continue;
		const { error: updateError } = await supabase.from('content_blocks').update({ draft_value: value, status: 'draft' }).eq('id', row.id);
		if (updateError) return { failure: dbFail(updateError) };
	}
	return { supabase, ids };
}

export const actions: Actions = {
	...landingActions(() => null),

	saveTexts: async ({ request, locals }) => {
		const saved = await saveTexts(locals, await request.formData());
		return saved.failure ?? { message: 'Drafts saved. Publish them to update the public pages.' };
	},

	publishTexts: async ({ request, locals }) => {
		const saved = await saveTexts(locals, await request.formData());
		if (saved.failure || !saved.supabase) return saved.failure;
		// The same RPC as the old Site content page: it records a revision and the publish log.
		for (const id of saved.ids ?? []) {
			const { error: rpcError } = await saved.supabase.rpc('publish_content_block', { p_id: id });
			if (rpcError) return dbFail(rpcError);
		}
		return { message: 'Published. The public pages update within a minute.' };
	}
};
