import { canManage, requireStaff } from '$lib/server/admin';
import { canEditBlocks, landingActions, loadBlocks } from '$lib/server/landing-blocks';
import type { Actions, PageServerLoad } from './$types';

// The home page's blocks are the ones with no program.
export const load: PageServerLoad = async ({ locals }) => {
	const { staff, supabase } = requireStaff(locals);
	return {
		...(await loadBlocks(supabase, null)),
		canEdit: canEditBlocks(staff, null),
		canManage: canManage(staff)
	};
};

export const actions: Actions = landingActions(() => null);
