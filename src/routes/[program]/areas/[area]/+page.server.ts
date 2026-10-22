import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Old URL: /[program]/areas/area-N → /[program]/area-N
export const load: PageServerLoad = ({ params }) => {
	redirect(308, `/${params.program}/${params.area}`);
};
