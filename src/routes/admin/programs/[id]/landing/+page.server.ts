import { error, fail } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import { canManage, dbFail, isHttpUrl, requireStaff, text } from '$lib/server/admin';
import type { StaffProfile } from '$lib/server/sso';
import type { Actions, PageServerLoad } from './$types';

const KINDS = ['gallery', 'stats', 'text', 'timeline'] as const;
type Kind = (typeof KINDS)[number];

const EMPTY: Record<Kind, object> = {
	gallery: { title: '', items: [] },
	stats: { title: 'Highlights', items: [] },
	text: { title: '', body: '' },
	timeline: { title: 'Our history', items: [] }
};

function canEditProgram(staff: StaffProfile, programId: string) {
	return canManage(staff) || (staff.role === 'area_chair' && staff.program_id === programId);
}

async function editor(locals: App.Locals, programId: string) {
	const { staff, supabase } = requireStaff(locals, ['admin', 'focal', 'area_chair']);
	if (!canEditProgram(staff, programId)) error(403, 'You cannot edit this program’s page.');
	return { staff, supabase };
}

/** Clean the posted block content for its kind; returns an error message when it is not valid. */
function cleanContent(kind: Kind, raw: string): object | string {
	let value: Record<string, unknown>;
	try {
		value = JSON.parse(raw);
	} catch {
		return 'The block could not be read. Reload the page and try again.';
	}
	const title = String(value.title ?? '').trim().slice(0, 200);

	if (kind === 'text') {
		return { title, body: String(value.body ?? '').trim().slice(0, 20000) };
	}

	const items = Array.isArray(value.items) ? value.items : [];
	if (kind === 'stats') {
		const clean = items
			.map((item) => ({ value: String(item?.value ?? '').trim().slice(0, 40), label: String(item?.label ?? '').trim().slice(0, 160) }))
			.filter((item) => item.value || item.label);
		if (clean.some((item) => !item.value || !item.label)) return 'Each highlight needs a value and a label.';
		return { title, items: clean.slice(0, 12) };
	}

	if (kind === 'timeline') {
		const clean = items
			.map((item) => ({
				year: String(item?.year ?? '').trim().slice(0, 40),
				title: String(item?.title ?? '').trim().slice(0, 200),
				body: String(item?.body ?? '').trim().slice(0, 4000)
			}))
			.filter((item) => item.year || item.title || item.body);
		if (clean.some((item) => !item.year || !item.title)) return 'Each timeline entry needs a year and a title.';
		return { title, items: clean.slice(0, 60) };
	}

	const clean = items
		.map((item) => ({
			src: String(item?.src ?? '').trim(),
			alt: String(item?.alt ?? '').trim().slice(0, 300),
			caption: String(item?.caption ?? '').trim().slice(0, 300)
		}))
		.filter((item) => item.src);
	if (clean.some((item) => !isHttpUrl(item.src))) return 'Each photo needs an https:// link or an uploaded image.';
	// Alt text describes the photo for screen readers; fall back to the caption.
	return {
		title,
		layout: value.layout === 'carousel' ? 'carousel' : 'grid',
		items: clean.slice(0, 60).map((item) => ({ ...item, alt: item.alt || item.caption || 'Photo' }))
	};
}

/** Save the posted draft (when the form carried one). Returns a failure, or null when saved. */
async function saveDraft(supabase: SupabaseClient, programId: string, form: FormData) {
	const kind = text(form, 'kind') as Kind;
	if (!form.has('content')) return null;
	if (!KINDS.includes(kind)) return fail(400, { message: 'Unknown block type.' });

	const content = cleanContent(kind, String(form.get('content') ?? '{}'));
	if (typeof content === 'string') return fail(400, { message: content });

	// Saving changes the draft only; the live copy stays until the block is published again.
	const { error: updateError } = await supabase
		.from('program_blocks')
		.update({ draft: content, status: 'draft' })
		.eq('id', text(form, 'id'))
		.eq('program_id', programId);
	return dbFail(updateError);
}

async function siblings(supabase: SupabaseClient, programId: string) {
	const { data } = await supabase.from('program_blocks').select('id, sort_order').eq('program_id', programId).order('sort_order').order('created_at');
	return data ?? [];
}

export const load: PageServerLoad = async ({ locals, params }) => {
	const { staff, supabase } = requireStaff(locals);

	const { data: program } = await supabase.from('programs').select('id, code, slug, name').eq('id', params.id).maybeSingle();
	if (!program) error(404, 'Program not found');

	const { data: blocks, error: loadError } = await supabase
		.from('program_blocks')
		.select('id, kind, sort_order, draft, published, status, updated_at')
		.eq('program_id', params.id)
		.order('sort_order')
		.order('created_at');

	return {
		program,
		blocks: blocks ?? [],
		error: loadError?.message ?? null,
		canEdit: canEditProgram(staff, program.id),
		canManage: canManage(staff)
	};
};

export const actions: Actions = {
	add: async ({ request, locals, params }) => {
		const { supabase } = await editor(locals, params.id);
		// "carousel" is a photo gallery shown as a slider.
		const requested = text(await request.formData(), 'kind');
		const carousel = requested === 'carousel';
		const kind = (carousel ? 'gallery' : requested) as Kind;
		if (!KINDS.includes(kind)) return fail(400, { message: 'Choose a block type.' });

		const list = await siblings(supabase, params.id);
		const { error: insertError } = await supabase.from('program_blocks').insert({
			program_id: params.id,
			kind,
			draft: carousel ? { title: '', layout: 'carousel', items: [] } : EMPTY[kind],
			sort_order: (list.at(-1)?.sort_order ?? -1) + 1,
			status: 'draft'
		});
		return dbFail(insertError) ?? { message: `${carousel ? 'Photo carousel' : 'Block'} added. Fill it in, then save.` };
	},

	save: async ({ request, locals, params }) => {
		const { supabase } = await editor(locals, params.id);
		return (await saveDraft(supabase, params.id, await request.formData())) ?? {
			message: 'Draft saved. Publish it to update the public page.'
		};
	},

	move: async ({ request, locals, params }) => {
		const { supabase } = await editor(locals, params.id);
		const form = await request.formData();
		const id = text(form, 'id');
		const direction = text(form, 'direction') === 'up' ? -1 : 1;

		const list = await siblings(supabase, params.id);
		const index = list.findIndex((block) => block.id === id);
		const other = list[index + direction];
		if (index === -1 || !other) return { message: 'Already at the end.' };

		// Renumber so equal sort orders cannot get stuck.
		const order = list.map((block) => block.id);
		[order[index], order[index + direction]] = [order[index + direction], order[index]];
		for (const [position, blockId] of order.entries()) {
			const { error: moveError } = await supabase.from('program_blocks').update({ sort_order: position }).eq('id', blockId);
			if (moveError) return dbFail(moveError);
		}
		return { message: 'Order saved.' };
	},

	submit: async ({ request, locals, params }) => {
		const { supabase } = await editor(locals, params.id);
		const form = await request.formData();
		const failed = await saveDraft(supabase, params.id, form);
		if (failed) return failed;
		const { error: rpcError } = await supabase.rpc('submit_program_block', { p_id: text(form, 'id') });
		return dbFail(rpcError) ?? { message: 'Submitted for review.' };
	},

	publish: async ({ request, locals, params }) => {
		const { supabase } = requireStaff(locals, ['admin', 'focal']);
		const form = await request.formData();
		const failed = await saveDraft(supabase, params.id, form);
		if (failed) return failed;
		const { error: rpcError } = await supabase.rpc('publish_program_block', { p_id: text(form, 'id') });
		return dbFail(rpcError) ?? { message: 'Published. The public page updates within a minute.' };
	},

	unpublish: async ({ request, locals }) => {
		const { supabase } = requireStaff(locals, ['admin', 'focal']);
		const { error: rpcError } = await supabase.rpc('unpublish_program_block', { p_id: text(await request.formData(), 'id') });
		return dbFail(rpcError) ?? { message: 'Taken off the public page. The draft is kept.' };
	},

	delete: async ({ request, locals, params }) => {
		const { supabase } = requireStaff(locals, ['admin', 'focal']);
		const { error: deleteError } = await supabase.from('program_blocks').delete().eq('id', text(await request.formData(), 'id')).eq('program_id', params.id);
		return dbFail(deleteError) ?? { message: 'Block deleted.' };
	}
};
