import { error, fail, redirect } from '@sveltejs/kit';
import { canManage, dbFail, HEX, integer, isHttpUrl, optional, requireStaff, SLUG, text, VISIT_SLUG } from '#lib/server/admin.js';
import { loadDriveSetup } from '#lib/server/drive-setup.js';
import { renameProgramCode } from '#lib/server/program-code.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { staff, supabase } = requireStaff(locals);

	const { data: program } = await supabase.from('programs').select('*').eq('id', params.id).maybeSingle();
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
	update: async ({ request, locals, params }) => {
		const { supabase } = requireStaff(locals, ['admin', 'focal']);
		const form = await request.formData();

		const values = {
			// Kept exactly as typed: "BSFi" stays "BSFi".
			code: text(form, 'code'),
			name: text(form, 'name'),
			slug: text(form, 'slug').toLowerCase(),
			degree: optional(form, 'degree'),
			summary: optional(form, 'summary'),
			tagline: optional(form, 'tagline')?.slice(0, 160) ?? null,
			logo_url: optional(form, 'logo_url'),
			cover_url: optional(form, 'cover_url'),
			website_url: optional(form, 'website_url'),
			email: optional(form, 'email')?.toLowerCase() ?? null,
			phone: optional(form, 'phone')?.slice(0, 60) ?? null,
			sort_order: integer(form, 'sort_order'),
			status: text(form, 'status') === 'published' ? 'published' : 'draft',
			theme_program: text(form, 'theme_program').toLowerCase(),
			theme_ink: text(form, 'theme_ink').toLowerCase(),
			theme_soft: text(form, 'theme_soft').toLowerCase(),
			theme_contrast: text(form, 'theme_contrast').toLowerCase()
		};

		if (!values.code || !values.name) return fail(400, { message: 'Code and name are required.' });
		if (!SLUG.test(values.slug)) return fail(400, { message: 'The URL slug can use lowercase letters, numbers, and dashes.' });
		if (values.logo_url && !isHttpUrl(values.logo_url)) return fail(400, { message: 'The logo needs an https:// link or an uploaded image.' });
		if (values.cover_url && !isHttpUrl(values.cover_url)) return fail(400, { message: 'The cover needs an https:// link or an uploaded image.' });
		if (values.website_url && !isHttpUrl(values.website_url)) return fail(400, { message: 'The website must start with https://' });
		if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return fail(400, { message: 'Check the email address.' });
		if (![values.theme_program, values.theme_ink, values.theme_soft, values.theme_contrast].every((color) => HEX.test(color))) {
			return fail(400, { message: 'Colors must be six-digit hex values like #7a1e2b.' });
		}

		const { data: before } = await supabase.from('programs').select('code').eq('id', params.id).single();

		const { error: updateError } = await supabase.from('programs').update(values).eq('id', params.id);
		const failed = dbFail(updateError);
		if (failed) return failed;

		let renamedNote = '';
		if (before?.code && before.code !== values.code) {
			const renamed = await renameProgramCode(supabase, params.id, before.code, values.code);
			if (renamed.documents || renamed.sections) {
				renamedNote = ` Renamed ${before.code} → ${values.code} in ${renamed.documents} document ${renamed.documents === 1 ? 'title' : 'titles'} and ${renamed.sections} section ${renamed.sections === 1 ? 'description' : 'descriptions'}.`;
			}
		}

		return { message: `Program saved.${renamedNote} The public site updates within a minute.`, ok: true };
	},

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

		redirect(303, `/admin/visits/${visit!.id}`);
	}
};
