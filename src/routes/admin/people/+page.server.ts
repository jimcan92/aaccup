import { error, fail } from '@sveltejs/kit';
import { STAFF_ROLES, supabaseService, type StaffRole } from '$lib/server/sso';
import type { Actions, PageServerLoad } from './$types';

export const prerender = false;

function requireAdmin(locals: App.Locals) {
	if (locals.staff?.role !== 'admin' || !locals.supabase) {
		error(403, 'Only an AACCUP admin can manage people.');
	}
	return { staff: locals.staff, supabase: locals.supabase };
}

function readRole(form: FormData): { role: StaffRole; programId: string | null } | string {
	const role = String(form.get('role') ?? '') as StaffRole;
	const programId = String(form.get('program_id') ?? '') || null;

	if (!STAFF_ROLES.includes(role)) return 'Choose a role.';
	if (role === 'area_chair' && !programId) return 'An area chair needs a program.';
	return { role, programId: role === 'area_chair' ? programId : null };
}

export const load: PageServerLoad = async ({ locals }) => {
	const { supabase } = requireAdmin(locals);

	const [people, programs] = await Promise.all([
		supabase
			.from('profiles')
			.select('id, email, full_name, role, program_id, created_at')
			.order('role')
			.order('full_name'),
		supabase.from('programs').select('id, code, name').order('code')
	]);

	return {
		people: people.data ?? [],
		programs: programs.data ?? [],
		error: people.error?.message ?? null
	};
};

export const actions: Actions = {
	add: async ({ request, locals }) => {
		const { supabase } = requireAdmin(locals);
		const service = supabaseService();
		if (!service) return fail(500, { message: 'The service-role key is not configured.' });

		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim().toLowerCase();
		const fullName = String(form.get('full_name') ?? '').trim();
		const parsed = readRole(form);

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(400, { message: 'Enter a valid email address.', email, fullName });
		if (typeof parsed === 'string') return fail(400, { message: parsed, email, fullName });

		const { data: existing } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
		if (existing) return fail(400, { message: `${email} is already on the list.`, email, fullName });

		// The auth user is only an identity anchor for RLS; people sign in through CTU Accounts.
		const { data: created, error: createError } = await service.auth.admin.createUser({
			email,
			email_confirm: true,
			user_metadata: { full_name: fullName },
			app_metadata: { role: parsed.role, program_id: parsed.programId, provider: 'ctu-accounts' }
		});
		if (createError || !created.user) return fail(400, { message: createError?.message ?? 'Could not add this person.', email, fullName });

		const { error: roleError } = await supabase.rpc('admin_set_role', {
			p_user: created.user.id,
			p_role: parsed.role,
			p_program_id: parsed.programId,
			p_area_id: null
		});
		if (roleError) return fail(400, { message: roleError.message, email, fullName });

		if (fullName) {
			await supabase.from('profiles').update({ full_name: fullName }).eq('id', created.user.id);
		}

		return { message: `${email} can now sign in with CTU Accounts.` };
	},

	role: async ({ request, locals }) => {
		const { staff, supabase } = requireAdmin(locals);
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const parsed = readRole(form);

		if (typeof parsed === 'string') return fail(400, { message: parsed });
		if (id === staff.id && parsed.role !== 'admin') {
			return fail(400, { message: 'You cannot remove your own admin role. Ask another admin.' });
		}

		const { error: roleError } = await supabase.rpc('admin_set_role', {
			p_user: id,
			p_role: parsed.role,
			p_program_id: parsed.programId,
			p_area_id: null
		});
		if (roleError) return fail(400, { message: roleError.message });

		return { message: 'Role updated.' };
	},

	remove: async ({ request, locals }) => {
		const { staff } = requireAdmin(locals);
		const service = supabaseService();
		if (!service) return fail(500, { message: 'The service-role key is not configured.' });

		const id = String((await request.formData()).get('id') ?? '');
		if (id === staff.id) return fail(400, { message: 'You cannot remove yourself.' });

		// Deleting the auth user cascades to the profile; revisions keep their history with a null actor.
		const { error: deleteError } = await service.auth.admin.deleteUser(id);
		if (deleteError) return fail(400, { message: deleteError.message });

		return { message: 'Removed. Their CTU account no longer opens the AACCUP Desk.' };
	}
};
