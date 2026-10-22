import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Old URL: /[program]/visit/[area] → /[program]/[area]
export const load: PageServerLoad = ({ params }) => {
	redirect(308, `/${params.program}/${params.area}`);
};
