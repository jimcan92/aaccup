import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Old URL: the shared records page is now each program's own common documents.
export const load: PageServerLoad = ({ params }) => {
	redirect(308, `/${params.program}/common`);
};
