export type DocumentKind =
	| 'recommendation'
	| 'compliance'
	| 'narrative'
	| 'supporting'
	| 'checklist'
	| 'presentation'
	| 'institutional'
	| 'form';

export type DocumentFormat = 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'folder' | 'link';

export type DocumentStatus = 'linked' | 'pending';

export interface EvidenceDocument {
	id: string;
	title: string;
	kind: DocumentKind;
	format: DocumentFormat;
	status: DocumentStatus;
	driveUrl?: string;
	updated?: string;
	note?: string;
}

/**
 * common   — Certification, BOR, COPC, checklist, additional documents
 * current  — sections under review in this visit (Instruction, Extension, …)
 * previous — the previous survey's 10 areas and program-wide records
 */
export type SectionKind = 'common' | 'current' | 'previous';

export interface Section {
	slug: string;
	kind: SectionKind;
	/** Display number inside its kind (area number for previous, order for current). */
	number?: number;
	title: string;
	shortTitle: string;
	description: string;
	/** What the evaluator will look for. */
	focus?: string;
	documents: EvidenceDocument[];
}

export type VisitStatus = 'active' | 'archived';

export interface Visit {
	slug: string;
	year: number;
	/** e.g. "Level III" */
	level: string;
	/** e.g. "Level III visit" — never "accredited" unless official. */
	label: string;
	status: VisitStatus;
	/** Label for the survey the previous-visit areas came from, e.g. "2024 survey". */
	previousLabel?: string;
	sections: Section[];
}

export interface ProgramTheme {
	/** Main program color: header, hero, buttons. */
	program: string;
	/** Dark variant for text on light surfaces. */
	ink: string;
	/** Light tint for surfaces. */
	soft: string;
	/** Text color placed on top of `program`. */
	contrast: string;
}

export interface Program {
	slug: string;
	code: string;
	name: string;
	degree: string;
	summary: string;
	/** Optional logo (uploaded image or link) and a one-line tagline, shown on cards and the program hero. */
	logo?: string;
	tagline?: string;
	/** Optional photo behind the home page card; also the program banner when it has no gallery. */
	cover?: string;
	/** Optional contact details, shown on the program home page. */
	website?: string;
	email?: string;
	phone?: string;
	theme: ProgramTheme;
	sortOrder: number;
	visits: Visit[];
}

export interface IndexedDocument extends EvidenceDocument {
	section: Section;
	sectionLabel: string;
}
