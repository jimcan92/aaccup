import { ACTIVE_CONTENT_KEYS } from '#lib/data/site.js';
import { sectionHref } from '#lib/admin-links.js';
import { previewUrl } from '#lib/drive-url.js';
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

	let query = locals.supabase
		? locals.supabase
				.from('programs')
				.select('id, slug, code, name, sort_order, theme_program, theme_ink, theme_soft, theme_contrast, visits(year, label, status, areas(kind, documents(status, workflow)))')
				.order('sort_order')
		: null;
	if (query && locals.staff?.role === 'area_chair' && locals.staff.program_id) query = query.eq('id', locals.staff.program_id);
	const { data: rows } = query ? await query : { data: [] };

	const programSummaries = (rows ?? []).map((program) => {
		const visit = program.visits.find((item) => item.status === 'active');
		const areas = visit?.areas ?? [];
		const groups = (['common', 'current', 'previous'] as const).map((kind) => {
			const documents = areas.filter((area) => area.kind === kind).flatMap((area) => area.documents);
			return { kind, linked: documents.filter((d) => d.status === 'linked').length, total: documents.length };
		});
		const documents = areas.flatMap((area) => area.documents);

		return {
			id: program.id,
			slug: program.slug,
			code: program.code,
			name: program.name,
			theme: {
				program: program.theme_program ?? '#335052',
				ink: program.theme_ink ?? '#082a2c',
				soft: program.theme_soft ?? '#e3e9e1',
				contrast: program.theme_contrast ?? '#ffffff'
			},
			visit: visit ? `${visit.year} · ${visit.label}` : 'No active visit',
			linked: documents.filter((d) => d.status === 'linked').length,
			total: documents.length,
			waiting: documents.filter((d) => d.workflow === 'in_review').length,
			groups
		};
	});

	// Links an evaluator could not open: not shared publicly, gone from the Drive folder, or not a
	// Drive link at all (those show as "In preparation"). Active visits only; RLS limits area chairs.
	type LinkRow = {
		id: string;
		title: string;
		drive_url: string | null;
		drive_public: boolean | null;
		drive_missing: boolean;
		area: { id: string; title: string; short_title: string | null; visit: { id: string; program: { id: string; code: string } } };
	};
	const { data: linkRows } = locals.supabase
		? await locals.supabase
				.from('documents')
				.select('id, title, drive_url, drive_public, drive_missing, area:areas!inner(id, title, short_title, visit:visits!inner(id, status, program:programs(id, code)))')
				.eq('area.visit.status', 'active')
				.not('drive_url', 'is', null)
		: { data: [] };

	const linkIssues = ((linkRows ?? []) as unknown as LinkRow[])
		.map((row) => ({
			id: row.id,
			title: row.title,
			href: sectionHref(row.area.visit.program.id, row.area.visit.id, row.area.id),
			section: `${row.area.visit.program.code} · ${row.area.short_title || row.area.title}`,
			problem: row.drive_missing
				? 'Missing in Drive'
				: row.drive_public === false
					? 'Not shared publicly'
					: !previewUrl(row.drive_url ?? undefined)
						? 'Not a Drive link'
						: null
		}))
		.filter((row) => row.problem !== null);

	return {
		blocks: blocks ?? [],
		programs: programSummaries,
		linkIssues
	};
};
