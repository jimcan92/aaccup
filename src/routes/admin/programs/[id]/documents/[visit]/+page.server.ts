import { error, fail, redirect } from '@sveltejs/kit';
import { RESERVED_SECTION_SLUGS } from '#lib/data/accreditation.js';
import { canManage, dbFail, integer, optional, requireStaff, SLUG, text, VISIT_SLUG } from '#lib/server/admin.js';
import { driveConfigured, folderIdFrom, folderName } from '#lib/server/drive.js';
import { loadDriveSetup } from '#lib/server/drive-setup.js';
import { summary, syncVisit } from '#lib/server/drive-sync.js';
import { documentsHref, sectionHref } from '#lib/admin-links.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { staff, supabase } = requireStaff(locals);

	const { data: visit } = await supabase
		.from('visits')
		.select('*, program:programs(id, code, slug, name, theme_program)')
		.eq('id', params.visit)
		.eq('program_id', params.id)
		.maybeSingle();
	if (!visit) error(404, 'Visit not found');

	const [{ data: areas }, { data: sources }, drive] = await Promise.all([
		supabase
			.from('areas')
			.select('id, kind, number, slug, title, short_title, status, sort_order, drive_folder_id, drive_folder_name, documents(id, status, workflow, drive_public, drive_missing)')
			.eq('visit_id', params.visit)
			.order('sort_order')
			.order('number'),
		// Copy sources: other visits that have a common section.
		supabase
			.from('visits')
			.select('id, year, label, program:programs(code), areas!inner(kind)')
			.neq('id', params.visit)
			.eq('areas.kind', 'common')
			.order('year', { ascending: false }),
		loadDriveSetup(supabase, params.visit)
	]);

	return {
		visit,
		crumbs: [{ label: 'Documents', href: documentsHref(params.id) }, { label: `${visit.year} · ${visit.label}` }],
		sections: (areas ?? []).map((area) => ({
			...area,
			linked: area.documents.filter((document) => document.status === 'linked').length,
			total: area.documents.length,
			unpublished: area.documents.filter((document) => document.workflow !== 'published').length,
			driveIssues: area.documents.filter((document) => document.drive_public === false || document.drive_missing).length
		})),
		drive,
		sources: (sources ?? []).map((source) => ({
			id: source.id,
			label: `${(source.program as unknown as { code: string } | null)?.code ?? ''} · ${source.year} ${source.label}`
		})),
		canManage: canManage(staff)
	};
};

export const actions: Actions = {
	update: async ({ request, locals, params }) => {
		const { supabase } = requireStaff(locals, ['admin', 'focal']);
		const form = await request.formData();
		const values = {
			slug: text(form, 'slug').toLowerCase(),
			year: integer(form, 'year'),
			level: text(form, 'level'),
			label: text(form, 'label'),
			previous_label: optional(form, 'previous_label'),
			workflow: text(form, 'workflow') === 'published' ? 'published' : 'draft',
			sort_order: integer(form, 'sort_order')
		};

		if (!VISIT_SLUG.test(values.slug)) return fail(400, { message: 'The visit slug must start with the year, e.g. 2029-level-iv.' });
		if (!values.year || !values.level || !values.label) return fail(400, { message: 'Year, level, and label are required.' });
		if (/accredited/i.test(values.label)) {
			return fail(400, { message: 'Use “visit” in the label (e.g. “Level III visit”), not “accredited”.' });
		}

		const { error: updateError } = await supabase.from('visits').update(values).eq('id', params.visit);
		return dbFail(updateError) ?? { message: 'Visit saved.' };
	},

	activate: async ({ locals, params }) => {
		const { supabase } = requireStaff(locals, ['admin', 'focal']);
		const { data: visit } = await supabase.from('visits').select('program_id').eq('id', params.visit).single();
		if (!visit) return fail(404, { message: 'Visit not found.' });

		// One active visit per program: archive the current one first.
		const { error: archiveError } = await supabase
			.from('visits')
			.update({ status: 'archived' })
			.eq('program_id', visit.program_id)
			.eq('status', 'active');
		if (archiveError) return dbFail(archiveError);

		const { error: activateError } = await supabase.from('visits').update({ status: 'active' }).eq('id', params.visit);
		return dbFail(activateError) ?? { message: 'This is now the active visit. /program shows it; the previous one moved to its own URL.' };
	},

	createSection: async ({ request, locals, params }) => {
		const { supabase } = requireStaff(locals, ['admin', 'focal']);
		const form = await request.formData();
		const kind = text(form, 'kind');
		const title = text(form, 'title');
		const number = text(form, 'number') ? integer(form, 'number') : null;
		const slug = (text(form, 'slug') || (kind === 'previous' && number ? `area-${number}` : title))
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '');

		if (!['common', 'current', 'previous'].includes(kind)) return fail(400, { message: 'Choose a section group.' });
		if (!title) return fail(400, { message: 'A section needs a title.' });
		if (!SLUG.test(slug) || RESERVED_SECTION_SLUGS.includes(slug)) {
			return fail(400, { message: `“${slug}” cannot be used as a section URL.` });
		}

		const { data: section, error: insertError } = await supabase
			.from('areas')
			.insert({
				visit_id: params.visit,
				kind,
				number,
				slug,
				title,
				short_title: optional(form, 'short_title') ?? title,
				description: optional(form, 'description'),
				focus: optional(form, 'focus'),
				sort_order: integer(form, 'sort_order', 100),
				status: 'draft'
			})
			.select('id')
			.single();

		const failed = dbFail(insertError);
		if (failed) return failed;
		redirect(303, sectionHref(params.id, params.visit, section!.id));
	},

	setRootFolder: async ({ request, locals, params }) => {
		const { supabase } = requireStaff(locals, ['admin', 'focal']);
		const raw = text(await request.formData(), 'folder');
		if (!raw) {
			const { error: clearError } = await supabase.from('visits').update({ drive_root_folder_id: null }).eq('id', params.visit);
			return dbFail(clearError) ?? { message: 'Drive folder removed. Existing documents stay as they are.' };
		}

		const id = folderIdFrom(raw);
		if (!id) return fail(400, { message: 'Paste a Google Drive folder link, e.g. https://drive.google.com/drive/folders/…' });

		let name = '';
		if (driveConfigured()) {
			try {
				name = await folderName(id);
			} catch (err) {
				return fail(400, { message: `Cannot open that folder: ${(err as Error).message}` });
			}
		}

		const { error: updateError } = await supabase.from('visits').update({ drive_root_folder_id: id }).eq('id', params.visit);
		return dbFail(updateError) ?? { message: `Drive folder ${name ? `“${name}” ` : ''}saved. Run Sync now to match its subfolders.` };
	},

	syncDrive: async ({ locals, params }) => {
		const { staff } = requireStaff(locals, ['admin', 'focal']);
		if (!driveConfigured()) return fail(400, { message: 'Google Drive is not configured on this deployment (GOOGLE_SERVICE_ACCOUNT_JSON).' });
		const totals = await syncVisit(params.visit, 'manual', staff.id);
		return { message: summary(totals) };
	},

	copyCommon: async ({ request, locals, params }) => {
		const { supabase } = requireStaff(locals, ['admin', 'focal']);
		const from = text(await request.formData(), 'from');
		if (!from) return fail(400, { message: 'Choose a visit to copy from.' });

		const { data: copied, error: rpcError } = await supabase.rpc('copy_common_documents', {
			p_from_visit: from,
			p_to_visit: params.visit
		});
		return (
			dbFail(rpcError) ?? {
				message: `Copied ${copied} common ${copied === 1 ? 'document' : 'documents'} as drafts. Check each title and link belongs to this program, then publish.`
			}
		);
	}
};
