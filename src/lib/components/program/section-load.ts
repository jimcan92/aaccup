import { error } from '@sveltejs/kit';
import type { Visit } from '$lib/data/types';

/** Find a section in a visit, with its neighbours in reading order. */
export function sectionLoad(visit: Visit, slug: string) {
	const index = visit.sections.findIndex((section) => section.slug === slug);

	if (index === -1) {
		error(404, 'Section not found');
	}

	return {
		section: visit.sections[index],
		previous: visit.sections[index - 1] ?? null,
		next: visit.sections[index + 1] ?? null
	};
}
