import { activeVisit, programs } from '$lib/data/accreditation';
import { sectionLoad } from '$lib/components/program/section-load';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () =>
	programs.flatMap((program) =>
		activeVisit(program).sections.map((section) => ({ program: program.slug, section: section.slug }))
	);

export const load: PageLoad = async ({ params, parent }) => sectionLoad((await parent()).visit, params.section);
