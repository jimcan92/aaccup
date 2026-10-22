import { error } from '@sveltejs/kit';
import { activeVisit, getProgram, getVisit, visitBase } from '$lib/data/accreditation';
import { site } from '$lib/data/site';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = ({ params }) => {
	const program = getProgram(params.program);

	if (!program) {
		error(404, 'Program not found');
	}

	const visit = params.visit ? getVisit(program, params.visit) : activeVisit(program);

	if (!visit) {
		error(404, 'Visit not found');
	}

	return {
		program,
		visit,
		base: visitBase(program, visit),
		contactNote: site.contactNote
	};
};
