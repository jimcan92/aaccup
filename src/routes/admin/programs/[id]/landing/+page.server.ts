import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// The program page editor is now the Program page tab of the program itself.
export const load: PageServerLoad = ({ params }) => redirect(308, `/admin/programs/${params.id}`);
