import { error, fail, type Actions } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import { canManage, dbFail, isHttpUrl, requireStaff, text } from '#lib/server/admin.js';
import { cleaners } from '#lib/server/landing-content.js';
import type { StaffProfile } from '#lib/server/sso.js';
import { blockLabels, sampleContent, type BlockKind } from '#lib/landing.js';

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
				body: String(item?.body ?? '').trim().slice(0, 4000),
				photo: String(item?.photo ?? '').trim().slice(0, 500)
			}))
			.filter((item) => item.year || item.title || item.body || item.photo);
		if (clean.some((item) => !item.year || !item.title)) return 'Each timeline entry needs a year and a title.';
		if (clean.some((item) => item.photo && !isHttpUrl(item.photo))) return 'Each photo needs an https:// link or an uploaded image.';
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

/** Save the page order: each block's position in `order` becomes its sort order, so equal sort orders cannot get stuck. */
async function renumber(supabase: SupabaseClient, order: string[]) {
	for (const [position, blockId] of order.entries()) {
		const { error: moveError } = await supabase.from('program_blocks').update({ sort_order: position }).eq('id', blockId);
		if (moveError) return dbFail(moveError);
	}
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

		// A copy of a block from another page (or this one), added at the bottom as a draft.
		copy: async ({ request, locals, params }) => {
			const programId = programOf(params);
			const { supabase } = await editor(locals, programId);
			const { data: source } = await supabase.from('program_blocks').select('kind, draft, published').eq('id', text(await request.formData(), 'from')).maybeSingle();
			if (!source || !KINDS.includes(source.kind as Kind)) return fail(404, { message: 'That block is gone. Reload and pick another.' });

			// Run it through the same checks as a save, so a copy is always a valid block here.
			const content = cleanContent(source.kind as Kind, JSON.stringify(source.published ?? source.draft ?? {}));
			if (typeof content === 'string') return fail(400, { message: content });

			const list = await siblings(supabase, programId);
			const { error: insertError } = await supabase.from('program_blocks').insert({
				program_id: programId,
				kind: source.kind,
				draft: content,
				sort_order: (list.at(-1)?.sort_order ?? -1) + 1,
				status: 'draft'
			});
			return dbFail(insertError) ?? { message: `${blockLabels[source.kind as Kind]} copied as a draft. Change what belongs to the other page, then publish.` };
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

			const list = await siblings(supabase, programId);
			const index = list.findIndex((block) => block.id === id);
			if (index === -1) return { message: 'That block is gone; reload the page.' };

			// A position (1 = top) puts the block there and shifts the others; otherwise one step up or down.
			const asked = Number(text(form, 'position'));
			const target = Number.isInteger(asked) && asked >= 1
				? Math.min(asked, list.length) - 1
				: index + (text(form, 'direction') === 'up' ? -1 : 1);
			if (target < 0 || target >= list.length || target === index) return { message: 'Already there.' };

			const order = list.map((block) => block.id);
			order.splice(target, 0, ...order.splice(index, 1));
			return (await renumber(supabase, order)) ?? { message: 'Order saved.' };
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

		unpublish: async ({ request, locals, params }) => {
			const { supabase } = requireStaff(locals, ['admin', 'focal']);
			const id = text(await request.formData(), 'id');
			const { error: rpcError } = await supabase.rpc('unpublish_program_block', { p_id: id });
			if (rpcError) return dbFail(rpcError);

			// A block taken off the page moves to the bottom, so the live blocks stay together at the top.
			const order = (await siblings(supabase, programOf(params))).map((block) => block.id);
			if (order.includes(id)) order.push(...order.splice(order.indexOf(id), 1));
			return (await renumber(supabase, order)) ?? { message: 'Taken off the public page and moved to the bottom. The draft is kept.' };
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
