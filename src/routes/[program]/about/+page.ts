import { redirect } from '@sveltejs/kit';
import { programs } from '$lib/data/accreditation';
import type { EntryGenerator, PageLoad } from './$types';

// Old URL: the about page is folded into the program home.
export const entries: EntryGenerator = () => programs.map((program) => ({ program: program.slug }));

export const load: PageLoad = ({ params }) => {
	redirect(308, `/${params.program}`);
};
