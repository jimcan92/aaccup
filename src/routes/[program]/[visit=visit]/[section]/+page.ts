import { sectionLoad } from '$lib/components/program/section-load';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, parent }) => sectionLoad((await parent()).visit, params.section);
