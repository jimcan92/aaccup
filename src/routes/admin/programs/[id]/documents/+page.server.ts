import { error, fail, redirect } from '@sveltejs/kit';
import { visitHref } from '#lib/admin-links.js';
import { canManage, dbFail, integer, optional, requireStaff, text, VISIT_SLUG } from '#lib/server/admin.js';
import { loadDriveSetup } from '#lib/server/drive-setup.js';
import type { Actions, PageServerLoad } from './$types';

// The Documents tab: the program's visits, and Drive setup for the active one.
export const load: PageServerLoad = async ({ locals, params }) => {
	const { staff, supabase } = requireStaff(locals);

	const { data: program } = await supabase.from('programs').select('id, code, slug').eq('id', params.id).maybeSingle();
	if (!program) error(404, 'Program not found');

	const { data: visits } = await supabase
		.from('visits')
		.select('id, slug, year, level, label, status, workflow, areas(id, documents(id, status))')
		.eq('program_id', params.id)
		.order('year', { ascending: false });

	// Drive setup is shown for the active visit; other visits are set up on their own page.
	const active = (visits ?? []).find((visit) => visit.status === 'active') ?? visits?.[0];
	const drive = active ? await loadDriveSetup(supabase, active.id) : null;

	return {
		program,
		crumbs: [{ label: 'Documents' }],
		drive,
		visits: (visits ?? []).map((visit) => {
			const documents = visit.areas.flatMap((area) => area.documents);
			return {
				...visit,
				sections: visit.areas.length,
				linked: documents.filter((document) => document.status === 'linked').length,
				total: documents.length
			};
		}),
		canManage: canManage(staff)
	};
};

function slugify(value: string): string {
	return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const actions: Actions = {
	createVisit: async ({ request, locals, params }) => {
		const { supabase } = requireStaff(locals, ['admin', 'focal']);
		const form = await request.formData();
		const year = integer(form, 'year');
		const level = text(form, 'level');
		const label = text(form, 'label') || `${level} visit`;
		const slug = text(form, 'slug').toLowerCase() || `${year}-${slugify(level)}`;

		if (!year || !level) return fail(400, { message: 'Year and level are required.' });
		if (!VISIT_SLUG.test(slug)) return fail(400, { message: 'The visit slug must start with the year, e.g. 2029-level-iv.' });

		const { data: visit, error: insertError } = await supabase
			.from('visits')
			.insert({
				program_id: params.id,
				year,
				level,
				label,
				slug,
				previous_label: optional(form, 'previous_label'),
				status: 'archived',
				workflow: 'draft'
			})
			.select('id')
			.single();

		const failed = dbFail(insertError);
		if (failed) return failed;

		// Every visit gets its own common-documents section.
		await supabase.from('areas').insert({
			visit_id: visit!.id,
			kind: 'common',
			slug: 'common',
			title: 'Common documents',
			short_title: 'Common documents',
			description: 'Certification, board resolution, COPC, the AACCUP checklist, and additional documents.',
			sort_order: 0,
			status: 'draft'
		});

		redirect(303, visitHref(params.id, visit!.id));
	}
};
