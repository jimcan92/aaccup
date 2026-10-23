import { error } from '@sveltejs/kit';
import { visitBase } from '#lib/data/accreditation.js';
import { site } from '#lib/data/site.js';
import { loadDossier } from '#lib/server/dossier.js';
import type { LayoutServerLoad } from './$types';

// Rendered on request and cached at the edge, so a publish shows within about a minute.
export const prerender = false;

export const load: LayoutServerLoad = async ({ params, setHeaders }) => {
	const dossier = await loadDossier(params.program, params.visit);

	if (!dossier) {
		error(404, params.visit ? 'Visit not found' : 'Program not found');
	}

	setHeaders({ 'cache-control': 'public, s-maxage=60, stale-while-revalidate=300' });

	return {
		program: dossier.program,
		visit: dossier.visit,
		base: visitBase(dossier.program, dossier.visit),
		contactNote: site.contactNote
	};
};
