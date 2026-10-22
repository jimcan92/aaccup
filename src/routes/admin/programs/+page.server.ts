import { redirect } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import { canManage, dbFail, requireStaff, SLUG, text } from '$lib/server/admin';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { staff, supabase } = requireStaff(locals);

	let query = supabase
		.from('programs')
		.select('id, code, slug, name, degree, status, sort_order, theme_program, theme_soft, visits(id, slug, year, label, status, workflow)')
		.order('sort_order')
		.order('code');

	// Area chairs work inside one program.
	if (staff.role === 'area_chair' && staff.program_id) query = query.eq('id', staff.program_id);

	const { data, error } = await query;
	return { programs: data ?? [], error: error?.message ?? null, canManage: canManage(staff) };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const { supabase } = requireStaff(locals, ['admin', 'focal']);
		const form = await request.formData();
		const code = text(form, 'code');
		const name = text(form, 'name');
		const slug = (text(form, 'slug') || code).toLowerCase();

		if (!code || !name) return fail(400, { message: 'Code and name are required.', code, name, slug });
		if (!SLUG.test(slug)) return fail(400, { message: 'The URL slug can use lowercase letters, numbers, and dashes.', code, name, slug });

		const { data, error } = await supabase
			.from('programs')
			.insert({
				code,
				name,
				slug,
				degree: text(form, 'degree') || null,
				// New programs start hidden until a visit and sections exist.
				status: 'draft',
				theme_program: '#335052',
				theme_ink: '#082a2c',
				theme_soft: '#e3e9e1',
				theme_contrast: '#ffffff'
			})
			.select('id')
			.single();

		const failed = dbFail(error, { code, name, slug });
		if (failed) return failed;
		redirect(303, `/admin/programs/${data!.id}`);
	}
};
