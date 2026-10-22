import { activeVisit, countLinked, programs, sectionsOf, visitDocuments } from '$lib/data/accreditation';
import { ACTIVE_CONTENT_KEYS } from '$lib/data/site';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ locals }) => {
	const { data: blocks } = locals.supabase
		? await locals.supabase
				.from('content_blocks')
				.select('id, key, label, status, updated_at')
				.in('key', [...ACTIVE_CONTENT_KEYS])
				.order('updated_at', { ascending: false })
		: { data: [] };

	// Programs, visits and documents still come from the site data until they move to Supabase.
	const programSummaries = [...programs]
		.sort((a, b) => a.sortOrder - b.sortOrder)
		.map((program) => {
			const visit = activeVisit(program);
			const groups = (['common', 'current', 'previous'] as const).map((kind) => {
				const documents = sectionsOf(visit, kind).flatMap((section) => section.documents);
				return { kind, linked: countLinked(documents), total: documents.length };
			});
			const documents = visitDocuments(visit);

			return {
				slug: program.slug,
				code: program.code,
				name: program.name,
				theme: program.theme,
				visit: `${visit.year} · ${visit.label}`,
				linked: countLinked(documents),
				total: documents.length,
				groups
			};
		});

	return {
		blocks: blocks ?? [],
		programs: programSummaries
	};
};
