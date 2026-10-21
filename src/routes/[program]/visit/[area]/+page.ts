import { error } from '@sveltejs/kit';
import { programs } from '$lib/data/accreditation';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () =>
	programs.flatMap((program) =>
		program.currentVisitAreas.map((area) => ({ program: program.slug, area: area.slug }))
	);

export const load: PageLoad = ({ params, parent }) => {
	return parent().then(({ program }) => {
		const index = program.currentVisitAreas.findIndex((area) => area.slug === params.area);

		if (index === -1) {
			error(404, 'Current visit area not found');
		}

		return {
			area: program.currentVisitAreas[index],
			previous: program.currentVisitAreas[index - 1] ?? null,
			next: program.currentVisitAreas[index + 1] ?? null
		};
	});
};
