import {
	activeVisit,
	countLinked,
	getProgram,
	getVisit,
	programs as staticPrograms,
	visitDocuments
} from '$lib/data/accreditation';
import type {
	DocumentFormat,
	DocumentKind,
	DocumentStatus,
	Program,
	Section,
	SectionKind,
	Visit,
	VisitStatus
} from '$lib/data/types';
import { supabaseAnon } from './sso';

/**
 * Public read layer. Published rows come from Supabase through the
 * published_programs() and published_dossier() RPCs. When Supabase is not
 * configured or cannot be reached, the static data in accreditation.ts is used,
 * so the public site never goes down with the database.
 */

export type ProgramCard = {
	slug: string;
	code: string;
	name: string;
	theme: Program['theme'];
	visit: { year: number; label: string };
	linked: number;
	total: number;
	/** Optional program logo and one-line tagline. */
	logo?: string;
	tagline?: string;
	/** Background photo: the program's cover image, else the first photo of its landing gallery. */
	cover?: string;
};

export type Dossier = { program: Program; visit: Visit; source: 'supabase' | 'static' };

type CardRow = {
	slug: string;
	code: string;
	name: string;
	theme_program: string | null;
	theme_ink: string | null;
	theme_soft: string | null;
	theme_contrast: string | null;
	visit_year: number;
	visit_label: string;
	linked: number;
	total: number;
	logo_url?: string | null;
	tagline?: string | null;
	cover_url?: string | null;
};

type DossierJson = {
	program: {
		slug: string;
		code: string;
		name: string;
		degree: string | null;
		summary: string | null;
		sort_order: number;
		logo?: string | null;
		tagline?: string | null;
		cover?: string | null;
		website?: string | null;
		email?: string | null;
		phone?: string | null;
		theme: { program: string | null; ink: string | null; soft: string | null; contrast: string | null };
	};
	visit: { slug: string; year: number; level: string; label: string; previous_label: string | null; status: VisitStatus };
	visits: { slug: string; year: number; level: string; label: string; status: VisitStatus }[];
	sections: {
		slug: string;
		kind: SectionKind;
		number: number | null;
		title: string;
		short_title: string | null;
		description: string | null;
		focus: string | null;
		documents: {
			id: string;
			title: string;
			kind: DocumentKind;
			format: DocumentFormat;
			status: DocumentStatus;
			drive_url: string | null;
			updated: string | null;
			note: string | null;
		}[];
	}[];
};

const NEUTRAL_THEME = { program: '#082a2c', ink: '#082a2c', soft: '#e3e9e1', contrast: '#ffffff' };

function theme(raw: { program: string | null; ink: string | null; soft: string | null; contrast: string | null }) {
	return {
		program: raw.program || NEUTRAL_THEME.program,
		ink: raw.ink || NEUTRAL_THEME.ink,
		soft: raw.soft || NEUTRAL_THEME.soft,
		contrast: raw.contrast || NEUTRAL_THEME.contrast
	};
}

function staticCards(): ProgramCard[] {
	return [...staticPrograms]
		.sort((a, b) => a.sortOrder - b.sortOrder)
		.map((program) => {
			const visit = activeVisit(program);
			const documents = visitDocuments(visit);
			return {
				slug: program.slug,
				code: program.code,
				name: program.name,
				theme: program.theme,
				visit: { year: visit.year, label: visit.label },
				linked: countLinked(documents),
				total: documents.length
			};
		});
}

export async function loadProgramCards(): Promise<ProgramCard[]> {
	const supabase = supabaseAnon();
	if (!supabase) return staticCards();

	try {
		const { data, error } = await supabase.rpc('published_programs');
		if (error || !data) return staticCards();

		return (data as CardRow[]).map((row) => ({
			slug: row.slug,
			code: row.code,
			name: row.name,
			theme: theme({ program: row.theme_program, ink: row.theme_ink, soft: row.theme_soft, contrast: row.theme_contrast }),
			visit: { year: row.visit_year, label: row.visit_label },
			linked: Number(row.linked),
			total: Number(row.total),
			logo: row.logo_url || undefined,
			tagline: row.tagline || undefined,
			cover: row.cover_url || undefined
		}));
	} catch {
		return staticCards();
	}
}

function fromJson(json: DossierJson): { program: Program; visit: Visit } {
	const sections: Section[] = json.sections.map((section) => ({
		slug: section.slug,
		kind: section.kind,
		number: section.number ?? undefined,
		title: section.title,
		shortTitle: section.short_title || section.title,
		description: section.description ?? '',
		focus: section.focus ?? undefined,
		documents: section.documents.map((document) => ({
			id: document.id,
			title: document.title,
			kind: document.kind,
			format: document.format,
			status: document.status,
			driveUrl: document.drive_url ?? undefined,
			updated: document.updated ?? undefined,
			note: document.note ?? undefined
		}))
	}));

	const visit: Visit = {
		slug: json.visit.slug,
		year: json.visit.year,
		level: json.visit.level,
		label: json.visit.label,
		status: json.visit.status,
		previousLabel: json.visit.previous_label ?? undefined,
		sections
	};

	// Other visits only carry what the visit selector needs.
	const visits: Visit[] = json.visits.map((item) =>
		item.slug === visit.slug ? visit : { ...item, sections: [] }
	);

	const program: Program = {
		slug: json.program.slug,
		code: json.program.code,
		name: json.program.name,
		degree: json.program.degree ?? '',
		summary: json.program.summary ?? '',
		logo: json.program.logo || undefined,
		tagline: json.program.tagline || undefined,
		cover: json.program.cover || undefined,
		website: json.program.website || undefined,
		email: json.program.email || undefined,
		phone: json.program.phone || undefined,
		theme: theme(json.program.theme),
		sortOrder: json.program.sort_order,
		visits
	};

	return { program, visit };
}

function staticDossier(programSlug: string, visitSlug?: string): Dossier | null {
	const program = getProgram(programSlug);
	if (!program) return null;
	const visit = visitSlug ? getVisit(program, visitSlug) : activeVisit(program);
	return visit ? { program, visit, source: 'static' } : null;
}

/** null means the program or visit does not exist (or is not published): a 404. */
export async function loadDossier(programSlug: string, visitSlug?: string): Promise<Dossier | null> {
	const supabase = supabaseAnon();
	if (!supabase) return staticDossier(programSlug, visitSlug);

	try {
		const { data, error } = await supabase.rpc('published_dossier', {
			p_program: programSlug,
			p_visit: visitSlug ?? null
		});
		if (error) return staticDossier(programSlug, visitSlug);
		if (!data) return null;
		return { ...fromJson(data as DossierJson), source: 'supabase' };
	} catch {
		return staticDossier(programSlug, visitSlug);
	}
}
