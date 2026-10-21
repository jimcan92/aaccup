import { error } from '@sveltejs/kit';
import { getProgram, programs } from '$lib/data/accreditation';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () =>
	programs.flatMap((program) =>
		program.areas.map((area) => ({ program: program.slug, area: area.slug }))
	);

export const load: PageLoad = ({ params }) => {
	const program = getProgram(params.program);

	if (!program) {
		error(404, 'Program volume not found');
	}

	const index = program.areas.findIndex((area) => area.slug === params.area);

	if (index === -1) {
		error(404, 'Area not found');
	}

	return {
		program,
		area: program.areas[index],
		previous: program.areas[index - 1] ?? null,
		next: program.areas[index + 1] ?? null
	};
};
