import { error } from '@sveltejs/kit';
import { programs } from '$lib/data/accreditation';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () =>
	programs.flatMap((program) =>
		program.areas.map((area) => ({ program: program.slug, area: area.slug }))
	);

export const load: PageLoad = ({ params, parent }) => {
	return parent().then(({ program }) => {
		const index = program.areas.findIndex((area) => area.slug === params.area);

		if (index === -1) {
			error(404, 'Previous visit area not found');
		}

		return {
			area: program.areas[index],
			previous: program.areas[index - 1] ?? null,
			next: program.areas[index + 1] ?? null
		};
	});
};
