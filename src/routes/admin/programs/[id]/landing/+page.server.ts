import { error } from '@sveltejs/kit';
import { canManage, requireStaff } from '$lib/server/admin';
import { canEditBlocks, landingActions, loadBlocks } from '$lib/server/landing-blocks';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { staff, supabase } = requireStaff(locals);

	const { data: program } = await supabase.from('programs').select('id, code, slug, name').eq('id', params.id).maybeSingle();
	if (!program) error(404, 'Program not found');

	return {
		program,
		...(await loadBlocks(supabase, params.id)),
		canEdit: canEditBlocks(staff, program.id),
		canManage: canManage(staff),
		// Full width: the editor sits beside a preview.
		wide: true
	};
};

export const actions: Actions = landingActions((params) => params.id);
