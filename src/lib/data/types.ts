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

export interface Program {
	slug: ProgramSlug;
	code: string;
	name: string;
	degree: string;
	level: string;
	surveyYear: number;
	surveyWindow: string;
	accent: string;
	accentSoft: string;
	accentInk: string;
	summary: string;
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
	scope: 'area' | 'program' | 'institutional';
}
