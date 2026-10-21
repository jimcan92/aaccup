export type ProgramSlug = 'bsie' | 'bsfi';

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

export interface Area {
	number: number;
	slug: string;
	title: string;
	shortTitle: string;
	description: string;
	documents: EvidenceDocument[];
}

export interface CurrentVisitArea extends Area {
	focus: string;
}

export interface Program {
	slug: ProgramSlug;
	code: string;
	name: string;
	degree: string;
	visitLevel: string;
	level: string;
	statusNote: string;
	surveyYear: number;
	surveyWindow: string;
	previousVisitLabel: string;
	accent: string;
	accentSoft: string;
	accentInk: string;
	summary: string;
	summaryTitle: string;
	currentVisitAreas: CurrentVisitArea[];
	areas: Area[];
	programDocuments: EvidenceDocument[];
}

export interface IndexedDocument extends EvidenceDocument {
	programSlug: ProgramSlug;
	programCode: string;
	programName: string;
	areaNumber?: number;
	areaTitle?: string;
	areaShortTitle?: string;
	scope: 'current' | 'previous' | 'program' | 'records';
	sectionLabel: string;
}
