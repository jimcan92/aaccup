import { error } from '@sveltejs/kit';
import { getProgram, programs } from '$lib/data/accreditation';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => programs.map((program) => ({ program: program.slug }));

export const load: PageLoad = ({ params }) => {
	const program = getProgram(params.program);

	if (!program) {
		error(404, 'Program volume not found');
	}

	return { program };
};
