import { redirect } from '@sveltejs/kit';
import { programs } from '$lib/data/accreditation';
import type { EntryGenerator, PageLoad } from './$types';

// Old URL: the shared records page is now each program's own common documents.
export const entries: EntryGenerator = () => programs.map((program) => ({ program: program.slug }));

export const load: PageLoad = ({ params }) => {
	redirect(308, `/${params.program}/common`);
};
