import { loadProgramCards } from '#lib/server/dossier.js';
import type { RequestHandler } from './$types';

export const prerender = false;

/** Published programs (slug, code, name) for site-wide menus; cached like the public pages. */
export const GET: RequestHandler = async () => {
	const cards = await loadProgramCards();
	return Response.json(
		cards.map(({ slug, code, name }) => ({ slug, code, name })),
		{ headers: { 'cache-control': 'public, s-maxage=300, stale-while-revalidate=600' } }
	);
};
