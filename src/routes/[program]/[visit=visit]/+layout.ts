import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent, params, url }) => {
	const { visit } = await parent();

	// The active visit lives at /[program]; keep one URL per page.
	if (visit.status === 'active') {
		redirect(308, url.pathname.replace(`/${params.visit}`, '') || `/${params.program}`);
	}
};
