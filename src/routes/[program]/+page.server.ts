import { loadProgramPage } from '$lib/server/program-page';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => ({
	blocks: await loadProgramPage(params.program)
});
