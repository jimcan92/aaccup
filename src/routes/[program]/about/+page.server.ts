import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Old URL: the about page is folded into the program home.
export const load: PageServerLoad = ({ params }) => {
	redirect(308, `/${params.program}`);
};
