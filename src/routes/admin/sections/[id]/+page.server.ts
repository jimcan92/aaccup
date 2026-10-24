import { error, fail, redirect } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import { RESERVED_SECTION_SLUGS } from '#lib/data/accreditation.js';
import {
	canManage,
	dbFail,
	formatFromUrl,
	integer,
	isHttpUrl,
	optional,
	parseBulkLinks,
	requireStaff,
	SLUG,
	text
} from '#lib/server/admin.js';
import { previewUrl } from '#lib/drive-url.js';
import { driveConfigured, folderIdFrom, folderName } from '#lib/server/drive.js';
import { summary, syncArea } from '#lib/server/drive-sync.js';
import type { StaffProfile } from '#lib/server/sso.js';
import type { Actions, PageServerLoad } from './$types';

const NOT_DRIVE = ' That link is not a Google Drive file or folder, so it shows as “In preparation” until a Drive link replaces it.';

const KINDS = ['recommendation', 'compliance', 'narrative', 'supporting', 'checklist', 'presentation', 'institutional', 'form'];
const FORMATS = ['pdf', 'docx', 'xlsx', 'pptx', 'folder', 'link'];
const COMPLIANCE = ['complied', 'partial', 'not_yet'];

type Area = { id: string; program_id: string };

function canEditArea(staff: StaffProfile, area: Area): boolean {
	if (canManage(staff)) return true;
	return (
		staff.role === 'area_chair' &&
		staff.program_id === area.program_id &&
		(staff.area_id === null || staff.area_id === area.id)
	);
}

async function editableArea(locals: App.Locals, id: string) {
	const { staff, supabase } = requireStaff(locals, ['admin', 'focal', 'area_chair']);
	const { data: area } = await supabase.from('areas').select('id, program_id').eq('id', id).maybeSingle();
	if (!area || !canEditArea(staff, area)) error(403, 'You cannot edit this section.');
	return { staff, supabase, area };
}

function readDocument(form: FormData) {
	const driveUrl = optional(form, 'drive_url');
	const kind = text(form, 'kind');
	const format = text(form, 'format') || (driveUrl ? formatFromUrl(driveUrl) : 'pdf');
	return {
		title: text(form, 'title'),
		code: optional(form, 'code')?.slice(0, 40) ?? null,
		drive_url: driveUrl,
		kind: KINDS.includes(kind) ? kind : 'supporting',
		format: FORMATS.includes(format) ? format : 'link',
		// Only a Google Drive or Docs link counts as linked; anything else shows "In preparation".
		status: previewUrl(driveUrl ?? undefined) ? 'linked' : 'pending',
		note: optional(form, 'note'),
		updated_label: optional(form, 'updated_label'),
		sort_order: integer(form, 'sort_order')
	};
}

function validDocument(values: ReturnType<typeof readDocument>): string | null {
	if (!values.title) return 'A document needs a title.';
	if (values.drive_url && !isHttpUrl(values.drive_url)) return 'The link must start with https://';
	if (values.updated_label && !/^\d{4}-\d{2}-\d{2}$/.test(values.updated_label)) return 'Use the date format YYYY-MM-DD.';
	return null;
}

function readRecommendation(form: FormData) {
	const status = text(form, 'status');
	return {
		number: Math.min(Math.max(integer(form, 'number') || 1, 1), 999),
		recommendation: text(form, 'recommendation').slice(0, 2000),
		action_taken: optional(form, 'action_taken')?.slice(0, 4000) ?? null,
		status: COMPLIANCE.includes(status) ? status : 'not_yet',
		evidence_url: optional(form, 'evidence_url')
	};
}

function validRecommendation(values: ReturnType<typeof readRecommendation>): string | null {
	if (!values.recommendation) return 'Write the recommendation.';
	if (values.evidence_url && !isHttpUrl(values.evidence_url) && !/^\/(?!\/)/.test(values.evidence_url)) {
		return 'The evidence link must start with https:// or /.';
	}
	return null;
}

async function nextSort(supabase: SupabaseClient, areaId: string): Promise<number> {
	const { data } = await supabase
		.from('documents')
		.select('sort_order')
		.eq('area_id', areaId)
		.order('sort_order', { ascending: false })
		.limit(1);
	return (data?.[0]?.sort_order ?? -1) + 1;
}

export const load: PageServerLoad = async ({ locals, params }) => {
	const { staff, supabase } = requireStaff(locals);

	const { data: section } = await supabase
		.from('areas')
		.select('*, visit:visits(id, slug, year, label, status, program:programs(id, code, slug))')
		.eq('id', params.id)
		.maybeSingle();
	if (!section) error(404, 'Section not found');

	const { data: documents } = await supabase
		.from('documents')
		.select('id, title, code, kind, format, drive_url, status, updated_label, note, sort_order, workflow, updated_at, source, drive_public, drive_missing')
		.eq('area_id', params.id)
		.order('sort_order')
		.order('created_at');

	const { data: recommendations } = await supabase
		.from('recommendations')
		.select('id, number, recommendation, action_taken, status, evidence_url')
		.eq('area_id', params.id)
		.order('sort_order')
		.order('number');

	const ids = [section.id, ...(documents ?? []).map((document) => document.id)];
	const { data: history } = await supabase
		.from('revisions')
		.select('id, entity, entity_id, action, created_at, snapshot, actor:profiles(full_name, email)')
		.in('entity_id', ids)
		.order('created_at', { ascending: false })
		.limit(15);

	return {
		section,
		documents: documents ?? [],
		recommendations: recommendations ?? [],
		history: (history ?? []).map((row) => ({
			id: row.id,
			entity: row.entity,
			action: row.action,
			created_at: row.created_at,
			title: (row.snapshot as { title?: string })?.title ?? '',
			actor: (row.actor as unknown as { full_name: string | null; email: string } | null)?.full_name ??
				(row.actor as unknown as { email: string } | null)?.email ??
				'Someone'
		})),
		canEdit: canEditArea(staff, section),
		driveConfigured: driveConfigured(),
		canManage: canManage(staff),
		kinds: KINDS,
		formats: FORMATS
	};
};

export const actions: Actions = {
	// Section details are for admin and focal. Area chairs work on the documents: the
	// workflow guard blocks them from changing a published row, and resetting a whole
	// section to draft would take it off the public site.
	updateSection: async ({ request, locals, params }) => {
		const { staff, supabase } = requireStaff(locals, ['admin', 'focal']);
		const form = await request.formData();
		const values: Record<string, unknown> = {
			title: text(form, 'title'),
			short_title: optional(form, 'short_title'),
			description: optional(form, 'description'),
			focus: optional(form, 'focus'),
			chair: optional(form, 'chair')?.slice(0, 120) ?? null
		};
		if (!values.title) return fail(400, { message: 'A section needs a title.' });

		if (canManage(staff)) {
			const slug = text(form, 'slug').toLowerCase();
			if (!SLUG.test(slug) || RESERVED_SECTION_SLUGS.includes(slug)) return fail(400, { message: `“${slug}” cannot be used as a section URL.` });
			values.slug = slug;
			values.number = text(form, 'number') ? integer(form, 'number') : null;
			values.sort_order = integer(form, 'sort_order');
		}

		const { error: updateError } = await supabase.from('areas').update(values).eq('id', params.id);
		return dbFail(updateError) ?? { message: 'Section saved.' };
	},

	submitSection: async ({ locals, params }) => {
		const { supabase } = await editableArea(locals, params.id);
		const { error: rpcError } = await supabase.rpc('submit_area', { p_id: params.id });
		return dbFail(rpcError) ?? { message: 'Section submitted for review.' };
	},

	publishSection: async ({ locals, params }) => {
		const { supabase } = requireStaff(locals, ['admin', 'focal']);
		const { error: rpcError } = await supabase.rpc('publish_area', { p_id: params.id });
		return dbFail(rpcError) ?? { message: 'Section published. It appears on the public site within a minute.' };
	},

	deleteSection: async ({ locals, params }) => {
		const { supabase } = requireStaff(locals, ['admin', 'focal']);
		const { data: area } = await supabase.from('areas').select('visit_id').eq('id', params.id).single();
		const { error: deleteError } = await supabase.from('areas').delete().eq('id', params.id);
		const failed = dbFail(deleteError);
		if (failed) return failed;
		redirect(303, `/admin/visits/${area?.visit_id ?? ''}`);
	},

	setFolder: async ({ request, locals, params }) => {
		const { supabase } = requireStaff(locals, ['admin', 'focal']);
		const raw = text(await request.formData(), 'folder');

		// Empty = go back to automatic matching from the visit's root folder.
		if (!raw) {
			const { error: resetError } = await supabase
				.from('areas')
				.update({ drive_folder_id: null, drive_folder_name: null, drive_folder_source: 'auto' })
				.eq('id', params.id);
			return dbFail(resetError) ?? { message: 'Back to automatic matching. The next visit sync picks the folder.' };
		}

		const id = folderIdFrom(raw);
		if (!id) return fail(400, { message: 'Paste a Google Drive folder link.' });

		let name: string | null = null;
		if (driveConfigured()) {
			try {
				name = await folderName(id);
			} catch (err) {
				return fail(400, { message: `Cannot open that folder: ${(err as Error).message}` });
			}
		}

		const { error: updateError } = await supabase
			.from('areas')
			.update({ drive_folder_id: id, drive_folder_name: name, drive_folder_source: 'manual' })
			.eq('id', params.id);
		return dbFail(updateError) ?? { message: `Folder ${name ? `“${name}” ` : ''}set for this section. Sync to pull its files.` };
	},

	syncSection: async ({ locals, params }) => {
		const { staff } = await editableArea(locals, params.id);
		if (!driveConfigured()) return fail(400, { message: 'Google Drive is not configured on this deployment.' });
		return { message: summary(await syncArea(params.id, staff.id)) };
	},

	addDocument: async ({ request, locals, params }) => {
		const { supabase } = await editableArea(locals, params.id);
		const values = readDocument(await request.formData());
		const problem = validDocument(values);
		if (problem) return fail(400, { message: problem });

		const { error: insertError } = await supabase
			.from('documents')
			.insert({ ...values, area_id: params.id, sort_order: await nextSort(supabase, params.id), workflow: 'draft' });
		return (
			dbFail(insertError) ?? {
				message: `Added “${values.title}” as a draft.${values.drive_url && values.status === 'pending' ? NOT_DRIVE : ''}`
			}
		);
	},

	bulkAdd: async ({ request, locals, params }) => {
		const { staff, supabase } = await editableArea(locals, params.id);
		const form = await request.formData();
		const parsed = parseBulkLinks(text(form, 'links'));
		if (typeof parsed === 'string') return fail(400, { message: parsed, links: text(form, 'links') });

		const kind = KINDS.includes(text(form, 'kind')) ? text(form, 'kind') : 'supporting';
		const publish = canManage(staff) && form.get('publish') === 'on';
		const start = await nextSort(supabase, params.id);

		const { error: insertError } = await supabase.from('documents').insert(
			parsed.map((row, index) => ({
				area_id: params.id,
				title: row.title,
				drive_url: row.url,
				format: row.format,
				kind,
				status: previewUrl(row.url) ? 'linked' : 'pending',
				sort_order: start + index,
				workflow: publish ? 'published' : 'draft'
			}))
		);
		return (
			dbFail(insertError, { links: text(form, 'links') }) ?? {
				message: `Added ${parsed.length} ${parsed.length === 1 ? 'link' : 'links'}${publish ? ' and published them' : ' as drafts'}.`
			}
		);
	},

	saveDocument: async ({ request, locals, params }) => {
		const { staff, supabase } = await editableArea(locals, params.id);
		const form = await request.formData();
		const id = text(form, 'id');
		const values = readDocument(form);
		const problem = validDocument(values);
		if (problem) return fail(400, { message: problem });

		// An area chair's change goes back through review instead of going live directly.
		const update = staff.role === 'area_chair' ? { ...values, workflow: 'draft' } : values;
		const { error: updateError } = await supabase.from('documents').update(update).eq('id', id).eq('area_id', params.id);
		return (
			dbFail(updateError) ?? {
				message:
					(staff.role === 'area_chair'
						? `Saved “${values.title}”. It is a draft again until a focal person publishes it.`
						: `Saved “${values.title}”.`) + (values.drive_url && values.status === 'pending' ? NOT_DRIVE : '')
			}
		);
	},

	submitDocument: async ({ request, locals, params }) => {
		const { supabase } = await editableArea(locals, params.id);
		const { error: rpcError } = await supabase.rpc('submit_document', { p_id: text(await request.formData(), 'id') });
		return dbFail(rpcError) ?? { message: 'Submitted for review.' };
	},

	publishDocument: async ({ request, locals }) => {
		const { supabase } = requireStaff(locals, ['admin', 'focal']);
		const { error: rpcError } = await supabase.rpc('publish_document', { p_id: text(await request.formData(), 'id') });
		return dbFail(rpcError) ?? { message: 'Published. It appears on the public site within a minute.' };
	},

	publishAll: async ({ locals, params }) => {
		const { supabase } = requireStaff(locals, ['admin', 'focal']);
		const { data: pending } = await supabase.from('documents').select('id').eq('area_id', params.id).neq('workflow', 'published');
		for (const document of pending ?? []) {
			const { error: rpcError } = await supabase.rpc('publish_document', { p_id: document.id });
			if (rpcError) return dbFail(rpcError);
		}
		return { message: `Published ${pending?.length ?? 0} documents.` };
	},

	addRecommendation: async ({ request, locals, params }) => {
		const { supabase } = await editableArea(locals, params.id);
		const values = readRecommendation(await request.formData());
		const problem = validRecommendation(values);
		if (problem) return fail(400, { message: problem });

		const { error: insertError } = await supabase
			.from('recommendations')
			.insert({ ...values, area_id: params.id, sort_order: values.number });
		return dbFail(insertError) ?? { message: `Added recommendation ${values.number}.` };
	},

	saveRecommendation: async ({ request, locals, params }) => {
		const { supabase } = await editableArea(locals, params.id);
		const form = await request.formData();
		const values = readRecommendation(form);
		const problem = validRecommendation(values);
		if (problem) return fail(400, { message: problem });

		const { error: updateError } = await supabase
			.from('recommendations')
			.update({ ...values, sort_order: values.number })
			.eq('id', text(form, 'id'))
			.eq('area_id', params.id);
		return dbFail(updateError) ?? { message: `Saved recommendation ${values.number}.` };
	},

	deleteRecommendation: async ({ request, locals, params }) => {
		const { supabase } = requireStaff(locals, ['admin', 'focal']);
		const { error: deleteError } = await supabase
			.from('recommendations')
			.delete()
			.eq('id', text(await request.formData(), 'id'))
			.eq('area_id', params.id);
		return dbFail(deleteError) ?? { message: 'Recommendation deleted.' };
	},

	deleteDocument: async ({ request, locals, params }) => {
		const { supabase } = requireStaff(locals, ['admin', 'focal']);
		const { error: deleteError } = await supabase.from('documents').delete().eq('id', text(await request.formData(), 'id')).eq('area_id', params.id);
		return dbFail(deleteError) ?? { message: 'Document deleted.' };
	}
};
