import { error, fail, type Actions } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import { canManage, dbFail, isHttpUrl, requireStaff, text } from '$lib/server/admin';
import { cleaners } from '$lib/server/landing-content';
import type { StaffProfile } from '$lib/server/sso';
import { blockLabels, sampleContent, type BlockKind } from '$lib/landing';

/**
 * Landing blocks for a program page, or for the home page when the program is null.
 * Both admin editors share these actions; only who may edit differs.
 */

const KINDS = Object.keys(blockLabels) as BlockKind[];
type Kind = BlockKind;

/** Program pages: admins and focal persons, or the program's own area chair. The home page: admins and focal persons. */
export function canEditBlocks(staff: StaffProfile, programId: string | null) {
	return canManage(staff) || (programId !== null && staff.role === 'area_chair' && staff.program_id === programId);
}

async function editor(locals: App.Locals, programId: string | null) {
	const { staff, supabase } = requireStaff(locals, ['admin', 'focal', 'area_chair']);
	if (!canEditBlocks(staff, programId)) error(403, programId ? 'You cannot edit this program’s page.' : 'Only admins and focal persons edit the home page.');
	return { staff, supabase };
}

/** Limit a query to one program's blocks, or to the home page's (no program). */
function scoped<Q>(query: Q, programId: string | null): Q {
	// Supabase's builder types are too deep to describe here; every filter builder has eq and is.
	const filter = query as unknown as { eq: (column: string, value: string) => Q; is: (column: string, value: null) => Q };
	return programId ? filter.eq('program_id', programId) : filter.is('program_id', null);
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
	if (kind in cleaners) return cleaners[kind](value, title);

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
async function saveDraft(supabase: SupabaseClient, programId: string | null, form: FormData) {
	const kind = text(form, 'kind') as Kind;
	if (!form.has('content')) return null;
	if (!KINDS.includes(kind)) return fail(400, { message: 'Unknown block type.' });

	const content = cleanContent(kind, String(form.get('content') ?? '{}'));
	if (typeof content === 'string') return fail(400, { message: content });

	// Saving changes the draft only; the live copy stays until the block is published again.
	const { error: updateError } = await scoped(
		supabase.from('program_blocks').update({ draft: content, status: 'draft' }).eq('id', text(form, 'id')),
		programId
	);
	return dbFail(updateError);
}

async function siblings(supabase: SupabaseClient, programId: string | null) {
	const { data } = await scoped(supabase.from('program_blocks').select('id, sort_order'), programId).order('sort_order').order('created_at');
	return data ?? [];
}

/** The blocks to edit, in page order. */
export async function loadBlocks(supabase: SupabaseClient, programId: string | null) {
	const { data, error: loadError } = await scoped(
		supabase.from('program_blocks').select('id, kind, sort_order, draft, published, status, updated_at'),
		programId
	)
		.order('sort_order')
		.order('created_at');
	return { blocks: data ?? [], error: loadError?.message ?? null };
}

/** Form actions for a block editor page; `programOf` reads the program id from the route (null for the home page). */
export function landingActions(programOf: (params: Record<string, string>) => string | null): Actions {
	return {
		add: async ({ request, locals, params }) => {
			const programId = programOf(params);
			const { supabase } = await editor(locals, programId);
			// "carousel" is a photo gallery shown as a slider.
			const requested = text(await request.formData(), 'kind');
			const carousel = requested === 'carousel';
			const kind = (carousel ? 'gallery' : requested) as Kind;
			if (!KINDS.includes(kind)) return fail(400, { message: 'Choose a block type.' });

			const list = await siblings(supabase, programId);
			const { error: insertError } = await supabase.from('program_blocks').insert({
				program_id: programId,
				kind,
				draft: carousel ? { title: '', layout: 'carousel', items: [] } : sampleContent[kind],
				sort_order: (list.at(-1)?.sort_order ?? -1) + 1,
				status: 'draft'
			});
			const filled = kind in cleaners ? ' It starts with sample text; replace it, then save.' : ' Fill it in, then save.';
			return dbFail(insertError) ?? { message: `${carousel ? 'Photo carousel' : blockLabels[kind]} added.${filled}` };
		},

		save: async ({ request, locals, params }) => {
			const programId = programOf(params);
			const { supabase } = await editor(locals, programId);
			return (await saveDraft(supabase, programId, await request.formData())) ?? {
				message: 'Draft saved. Publish it to update the public page.'
			};
		},

		move: async ({ request, locals, params }) => {
			const programId = programOf(params);
			const { supabase } = await editor(locals, programId);
			const form = await request.formData();
			const id = text(form, 'id');
			const direction = text(form, 'direction') === 'up' ? -1 : 1;

			const list = await siblings(supabase, programId);
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
			const programId = programOf(params);
			const { supabase } = await editor(locals, programId);
			const form = await request.formData();
			const failed = await saveDraft(supabase, programId, form);
			if (failed) return failed;
			const { error: rpcError } = await supabase.rpc('submit_program_block', { p_id: text(form, 'id') });
			return dbFail(rpcError) ?? { message: 'Submitted for review.' };
		},

		publish: async ({ request, locals, params }) => {
			const { supabase } = requireStaff(locals, ['admin', 'focal']);
			const form = await request.formData();
			const failed = await saveDraft(supabase, programOf(params), form);
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
			const { error: deleteError } = await scoped(
				supabase.from('program_blocks').delete().eq('id', text(await request.formData(), 'id')),
				programOf(params)
			);
			return dbFail(deleteError) ?? { message: 'Block deleted.' };
		}
	};
}
