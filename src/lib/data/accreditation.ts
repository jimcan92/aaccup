import type {
	Area,
	CurrentVisitArea,
	DocumentFormat,
	DocumentKind,
	EvidenceDocument,
	IndexedDocument,
	Program
} from './types';

const driveFile = (id: string) => `https://drive.google.com/file/d/${id}/view`;

function linked(
	id: string,
	title: string,
	kind: DocumentKind,
	url: string,
	options: { format?: DocumentFormat; updated?: string; note?: string } = {}
): EvidenceDocument {
	return {
		id,
		title,
		kind,
		format: options.format ?? 'pdf',
		status: 'linked',
		driveUrl: url,
		updated: options.updated ?? '2024-03-16',
		note: options.note
	};
}

function pending(
	id: string,
	title: string,
	kind: DocumentKind,
	note = 'Drive link to be supplied by the campus AACCUP task force.'
): EvidenceDocument {
	return {
		id,
		title,
		kind,
		format: 'pdf',
		status: 'pending',
		note
	};
}

const AREA_DEFINITIONS: Omit<Area, 'documents'>[] = [
	{
		number: 1,
		slug: 'area-1',
		title: 'Vision, Mission, Goals and Objectives',
		shortTitle: 'VMGO',
		description:
			'How the program defines its purpose, communicates it to the campus community, and reviews it against national and institutional priorities.'
	},
	{
		number: 2,
		slug: 'area-2',
		title: 'Faculty',
		shortTitle: 'Faculty',
		description:
			'Qualifications, workload, professional development, and performance of the teaching team behind the program.'
	},
	{
		number: 3,
		slug: 'area-3',
		title: 'Curriculum and Instruction',
		shortTitle: 'Curriculum',
		description:
			'Design, delivery, assessment, and relevance of the academic program, including alignment with industry and licensure expectations.'
	},
	{
		number: 4,
		slug: 'area-4',
		title: 'Support to Students',
		shortTitle: 'Student support',
		description:
			'Admissions, advising, student services, co-curricular opportunities, and the outcomes that follow learners through the program.'
	},
	{
		number: 5,
		slug: 'area-5',
		title: 'Research',
		shortTitle: 'Research',
		description:
			'Research productivity, culture, funding, dissemination, and the use of inquiry to strengthen teaching and community practice.'
	},
	{
		number: 6,
		slug: 'area-6',
		title: 'Extension and Community Involvement',
		shortTitle: 'Extension',
		description:
			'Community engagement, partnerships, and the measurable impact of the program beyond the campus gate.'
	},
	{
		number: 7,
		slug: 'area-7',
		title: 'Library',
		shortTitle: 'Library',
		description:
			'Collections, services, facilities, and learning resources that support the program’s reading, research, and instruction.'
	},
	{
		number: 8,
		slug: 'area-8',
		title: 'Physical Plant and Facilities',
		shortTitle: 'Facilities',
		description:
			'Campus grounds, buildings, utilities, safety, and the physical conditions that make learning possible.'
	},
	{
		number: 9,
		slug: 'area-9',
		title: 'Laboratories',
		shortTitle: 'Laboratories',
		description:
			'Equipment, safety, utilisation, and maintenance of the laboratory spaces that give the program its practical footing.'
	},
	{
		number: 10,
		slug: 'area-10',
		title: 'Administration',
		shortTitle: 'Administration',
		description:
			'Governance, planning, finance, records, and the institutional systems that keep the program accountable.'
	}
];

function areasFrom(byArea: Record<number, EvidenceDocument[]>): Area[] {
	return AREA_DEFINITIONS.map((area) => ({
		...area,
		documents: byArea[area.number] ?? []
	}));
}

const CURRENT_VISIT_DEFINITIONS: Omit<CurrentVisitArea, 'documents'>[] = [
	{
		number: 1,
		slug: 'faculty-development',
		title: 'Faculty Development',
		shortTitle: 'Faculty Development',
		description:
			'The program’s plan for faculty qualifications, professional growth, workload, and the impact of development on instruction.',
		focus:
			'Look for a documented faculty development plan, participation records, and evidence that development activities changed teaching practice.'
	},
	{
		number: 2,
		slug: 'instruction',
		title: 'Instruction',
		shortTitle: 'Instruction',
		description:
			'Curriculum delivery, assessment practices, learning resources, and the program’s system for reviewing and improving instruction.',
		focus:
			'Look for syllabi, assessment maps, classroom observations, and evidence that instruction is reviewed against intended learning outcomes.'
	},
	{
		number: 3,
		slug: 'extension',
		title: 'Extension',
		shortTitle: 'Extension',
		description:
			'Community engagement projects, beneficiary outcomes, and the participation of faculty and students in extension work.',
		focus:
			'Look for extension plans, MOAs, activity reports, beneficiary data, and evidence of measurable community impact.'
	},
	{
		number: 4,
		slug: 'linkages',
		title: 'Linkages',
		shortTitle: 'Linkages',
		description:
			'Partnerships, MOAs, industry collaboration, and the evidence that linkages are active rather than ceremonial.',
		focus:
			'Look for signed agreements, activity records, counterpart contributions, and evidence that partnerships benefit students and faculty.'
	}
];

function currentVisitAreasFrom(prefix: string): CurrentVisitArea[] {
	return CURRENT_VISIT_DEFINITIONS.map((area) => ({
		...area,
		documents: [
			pending(
				`${prefix}-visit-${area.slug}-narrative`,
				`${area.title} — Narrative report`,
				'narrative',
				'The narrative for this current-visit area is being prepared by the task force.'
			),
			pending(
				`${prefix}-visit-${area.slug}-supporting`,
				`${area.title} — Supporting evidence`,
				'supporting',
				'Supporting files will be linked here once the area chair supplies the Drive folder.'
			),
			pending(
				`${prefix}-visit-${area.slug}-matrix`,
				`${area.title} — Evidence matrix`,
				'compliance',
				'The evidence matrix will be posted with the current visit files.'
			)
		]
	}));
}

const bsfiAreaDocs: Record<number, EvidenceDocument[]> = {
	1: [
		linked('bsfi-a1-rec', 'Area 1 — Recommendations 1–8', 'recommendation', driveFile('1x5A_gwFaF2tLXErxvsVojA49PEMNwK1C'), {
			note: 'Recommendation and compliance evidence are combined in one file.'
		}),
		linked('bsfi-a1-compliance', 'Area 1 — Compliance report', 'compliance', driveFile('1x5A_gwFaF2tLXErxvsVojA49PEMNwK1C'))
	],
	2: [
		linked('bsfi-a2-rec', 'Area 2 — Recommendations 1–13', 'recommendation', driveFile('149Smel7NV98Jtn6EhEdJ2fKpm0oFnhhU')),
		linked('bsfi-a2-compliance', 'Area 2 — Compliance report', 'compliance', driveFile('149Smel7NV98Jtn6EhEdJ2fKpm0oFnhhU'))
	],
	3: [
		linked('bsfi-a3-rec', 'Area 3 — Recommendations 1–11', 'recommendation', driveFile('1W2irv_VtsSqu9PjukcIc9gSYNueXlKvc')),
		linked('bsfi-a3-compliance', 'Area 3 — Extent of compliance report', 'compliance', driveFile('1ADN6vlmVVVXj2K6r8Ry-HdUy4-mDpdl3'))
	],
	4: [
		linked('bsfi-a4-rec', 'Area 4 — Recommendations 1–10', 'recommendation', driveFile('1KuSgENBuFR5Wxv97U0oizls6lzgjH77p')),
		linked('bsfi-a4-compliance', 'Area 4 — Extent of compliance', 'compliance', driveFile('1KuSgENBuFR5Wxv97U0oizls6lzgjH77p'))
	],
	5: [
		linked('bsfi-a5-rec-1', 'Area 5 — Recommendation 1', 'recommendation', driveFile('1U3AcpBmqMgTV6vKLDWsMAPzwPDV_QJeO')),
		linked('bsfi-a5-rec-2', 'Area 5 — Recommendation 2', 'recommendation', driveFile('1h6e0o9SzIWxhSs85KP_7srK2UQpR_acM')),
		linked('bsfi-a5-rec-3', 'Area 5 — Recommendation 3', 'recommendation', driveFile('1jg5HHrLxz2z6_o_uPpem3gUbYYSJxRvL')),
		linked('bsfi-a5-compliance', 'Area 5 — Extent of compliance', 'compliance', driveFile('1uIn4wBve7YCaMSsynw28CmyH0yTzEbUg'))
	],
	6: [
		linked('bsfi-a6-rec', 'Area 6 — Recommendations 1–22', 'recommendation', driveFile('1Vkxe7ZhPoJk-tRIjMTdMLYxYch96giZA')),
		linked('bsfi-a6-narrative', 'Area 6 — Narrative profile', 'narrative', driveFile('1tFDiZ46A4Khy2qtES3cVMLpSzrtSsHuV'))
	],
	7: [
		linked('bsfi-a7-rec-1', 'Area 7 — Recommendation 1', 'recommendation', driveFile('1TgVJbOZjbpc6WiGHUGVW2_m0zJaoQxxk')),
		linked('bsfi-a7-rec-2', 'Area 7 — Recommendation 2', 'recommendation', driveFile('1gsvTM18lkMmwC0LOaSPF1Qe5CD623_p_')),
		linked('bsfi-a7-rec-3', 'Area 7 — Recommendation 3', 'recommendation', driveFile('1ESXkMpo70c_EEqwDDs1dCcAjd2BgJbTJ')),
		linked('bsfi-a7-rec-4', 'Area 7 — Recommendation 4', 'recommendation', driveFile('1l9Kw4OXvHdPuXDh9gUSDKpiSMV5MYCFH'))
	],
	8: [
		linked('bsfi-a8-rec', 'Area 8 — Recommendations 1–9', 'recommendation', driveFile('1XYD093V4AZph6dVCNIijh9DuOf7iCH9b')),
		linked('bsfi-a8-compliance', 'Area 8 — Extent of compliance report', 'compliance', driveFile('1h1nEzvxPY4Qg-ej4mQbU8iYWpnNk1N8y'))
	],
	9: [
		linked('bsfi-a9-rec', 'Area 9 — Recommendations 1–22', 'recommendation', driveFile('12jxQ4DQ2C2B27cJ940_wQKVk6tJIKEQt'))
	],
	10: [
		linked('bsfi-a10-rec', 'Area 10 — Recommendations 1–20', 'recommendation', driveFile('1y2XpRqt2pHPnNBAyuPD2ws2f4i2XF4vy')),
		linked('bsfi-a10-compliance', 'Area 10 — Compliance report', 'compliance', driveFile('1y2XpRqt2pHPnNBAyuPD2ws2f4i2XF4vy'))
	]
};

function pendingAreaDocs(number: number): EvidenceDocument[] {
	return [
		pending(`bsie-a${number}-rec`, `Area ${number} — Recommendations`, 'recommendation'),
		pending(`bsie-a${number}-compliance`, `Area ${number} — Compliance report`, 'compliance')
	];
}

const bsieAreaDocs: Record<number, EvidenceDocument[]> = Object.fromEntries(
	AREA_DEFINITIONS.map((area) => [area.number, pendingAreaDocs(area.number)])
);

const bsfiProgramDocs: EvidenceDocument[] = [
	linked('bsfi-extension-narrative', 'Extension — Narrative profile', 'narrative', driveFile('1wReBAJ793PL9chYaPzTQCqJyU-g72VHt')),
	linked('bsfi-extension-compliance', 'Extension — Compliance report', 'compliance', driveFile('1Vkxe7ZhPoJk-tRIjMTdMLYxYch96giZA')),
	linked('bsfi-library-narrative', 'Library — Narrative profile', 'narrative', driveFile('1cE8zMch20nt804ZARvVgAm7MpFQpDkgm')),
	linked('bsfi-linkages-narrative', 'Consortia and linkages — Narrative profile', 'narrative', driveFile('1PgSZXHxqXm4bFMYjmogKAg32FQTzzIBJ')),
	linked('bsfi-linkages-rafi', 'RAFI value-chain service agreement', 'supporting', driveFile('19AHJbrJAkowFNJV-ZpRW6o1HpMKYl0E7')),
	pending('bsfi-checklist', 'BSFI AACCUP checklist', 'checklist')
];

const bsieProgramDocs: EvidenceDocument[] = [
	pending('bsie-curriculum', 'Curriculum and instruction — Supporting evidence', 'supporting'),
	pending('bsie-extension', 'Extension — Narrative and compliance report', 'narrative'),
	pending('bsie-faculty', 'Faculty development — Supporting evidence', 'supporting'),
	pending('bsie-linkages', 'Linkages — MOAs and terminal reports', 'supporting'),
	pending('bsie-checklist', 'BSIE AACCUP checklist', 'checklist')
];

export const programs: Program[] = [
	{
		slug: 'bsie',
		code: 'BSIE',
		name: 'Bachelor of Science in Industrial Engineering',
		degree: 'BS Industrial Engineering',
		visitLevel: 'Level III',
		level: 'Level III visit',
		statusNote: 'Applying for Level III accreditation',
		surveyYear: 2026,
		surveyWindow: '2026 survey visit',
		previousVisitLabel: '',
		currentVisitAreas: currentVisitAreasFrom('bsie'),
		accent: '#7A1E2B',
		accentSoft: '#F1E2E4',
		accentInk: '#3B0D14',
		summary:
			'Industrial engineering at Moalboal prepares students to design, improve, and manage integrated systems of people, materials, information, and energy. The Level III dossier documents the program’s systems, its faculty, and its evidence of continuous improvement.',
		summaryTitle: 'The industrial engineering record.',
		areas: areasFrom(bsieAreaDocs),
		programDocuments: bsieProgramDocs
	},
	{
		slug: 'bsfi',
		code: 'BSFI',
		name: 'Bachelor of Science in Fisheries',
		degree: 'BS Fisheries',
		visitLevel: 'Level III',
		level: 'Level III visit',
		statusNote: 'Applying for Level III accreditation',
		surveyYear: 2026,
		surveyWindow: '2026 survey visit',
		previousVisitLabel: '2024 survey',
		currentVisitAreas: currentVisitAreasFrom('bsfi'),
		accent: '#1D5B3A',
		accentSoft: '#E2EDE4',
		accentInk: '#0B2C1B',
		summary:
			'Fisheries is the campus’s founding discipline. The Level III dossier traces the program from its coastal field work to its research, extension, and instruction record, with the evidence organised area by area.',
		summaryTitle: 'The fisheries record.',
		areas: areasFrom(bsfiAreaDocs),
		programDocuments: bsfiProgramDocs
	}
];

export const institutionalDocuments: EvidenceDocument[] = [
	pending(
		'inst-certification',
		'AACCUP certification',
		'institutional',
		'Signed certification for the Level III visit. The task force will publish the current PDF here.'
	),
	linked(
		'inst-bor',
		'Board resolution — reference record',
		'institutional',
		'https://sites.google.com/ctu.edu.ph/aacup2024/bor-resolution',
		{ format: 'link', note: 'Board Resolution No. 24, series of 2018. Replace with the current visit’s resolution.' }
	),
	linked(
		'inst-copc',
		'Certificate of Program Compliance — reference record',
		'institutional',
		'https://sites.google.com/ctu.edu.ph/aacup2024/copc',
		{ format: 'link', note: 'COPC reference from the 2024 BSFI dossier.' }
	),
	pending(
		'inst-checklist',
		'AACCUP checklist',
		'institutional',
		'The current checklist will be posted once the task force finalises the file.'
	),
	pending(
		'inst-additional',
		'Additional documents',
		'institutional',
		'Supplementary records, forms, and annexes for the survey visit.'
	)
];

export function getProgram(slug: string): Program | undefined {
	return programs.find((program) => program.slug === slug);
}

export function getArea(program: Program, number: number): Area | undefined {
	return program.areas.find((area) => area.number === number);
}

export function countLinked(documents: EvidenceDocument[]): number {
	return documents.filter((document) => document.status === 'linked').length;
}

export function documentIndex(program: Program): IndexedDocument[] {
	const rows: IndexedDocument[] = [];

	for (const area of program.currentVisitAreas) {
		for (const document of area.documents) {
			rows.push({
				...document,
				programSlug: program.slug,
				programCode: program.code,
				programName: program.name,
				areaNumber: area.number,
				areaTitle: area.title,
				areaShortTitle: area.shortTitle,
				scope: 'current',
				sectionLabel: `Current visit · ${area.title}`
			});
		}
	}

	for (const area of program.areas) {
		for (const document of area.documents) {
			rows.push({
				...document,
				programSlug: program.slug,
				programCode: program.code,
				programName: program.name,
				areaNumber: area.number,
				areaTitle: area.title,
				areaShortTitle: area.shortTitle,
				scope: 'previous',
				sectionLabel: `Previous visit · Area ${area.number}`
			});
		}
	}

	for (const document of program.programDocuments) {
		rows.push({
			...document,
			programSlug: program.slug,
			programCode: program.code,
			programName: program.name,
			scope: 'program',
			sectionLabel: 'Previous visit · Program-wide'
		});
	}

	for (const document of institutionalDocuments) {
		rows.push({
			...document,
			programSlug: program.slug,
			programCode: program.code,
			programName: program.name,
			scope: 'records',
			sectionLabel: 'Shared record'
		});
	}

	return rows;
}

export const documentKinds: { value: DocumentKind | 'all'; label: string }[] = [
	{ value: 'all', label: 'All document types' },
	{ value: 'recommendation', label: 'Recommendations' },
	{ value: 'compliance', label: 'Compliance reports' },
	{ value: 'narrative', label: 'Narrative profiles' },
	{ value: 'supporting', label: 'Supporting evidence' },
	{ value: 'checklist', label: 'Checklists' },
	{ value: 'presentation', label: 'Presentations' },
	{ value: 'institutional', label: 'Institutional records' },
	{ value: 'form', label: 'Forms' }
];
