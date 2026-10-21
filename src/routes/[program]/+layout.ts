import { error } from '@sveltejs/kit';
import { getProgram } from '$lib/data/accreditation';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = ({ params }) => {
	const program = getProgram(params.program);

	if (!program) {
		error(404, 'Program volume not found');
	}

	return { program };
};
