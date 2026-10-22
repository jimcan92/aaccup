import { redirect } from '@sveltejs/kit';
import { activeVisit, programs, sectionsOf } from '$lib/data/accreditation';
import type { EntryGenerator, PageLoad } from './$types';

// Old URL: /[program]/visit/[area] → /[program]/[area]
export const entries: EntryGenerator = () =>
	programs.flatMap((program) =>
		sectionsOf(activeVisit(program), 'current').map((section) => ({ program: program.slug, area: section.slug }))
	);

export const load: PageLoad = ({ params }) => {
	redirect(308, `/${params.program}/${params.area}`);
};
