/**
 * Starting sections for a new visit. They are only a preset: every section can still be
 * added, renamed or removed on the visit's page afterwards.
 *
 *  - First survey at a level: the level's mandatory areas, plus the options the program chose.
 *  - Revisit: only the areas the Board Action names (e.g. BSFi's 2024 result: revisit
 *    Instruction, Extension, and Linkages).
 *
 * Every visit also gets an "Additional documents" section for files the accreditors ask for
 * during the visit; a Drive folder named "Additional documents" links to it.
 */

export type VisitType = 'first' | 'revisit';

export type AreaPreset = { slug: string; title: string; shortTitle: string; description: string };

/** Areas a current visit may cover; titles match the Drive folder names the sync looks for. */
export const VISIT_AREAS: AreaPreset[] = [
	{
		slug: 'instruction',
		title: 'Instruction',
		shortTitle: 'Instruction',
		description: 'Curriculum delivery, assessment practices, learning resources, and the program’s system for reviewing and improving instruction.'
	},
	{
		slug: 'extension',
		title: 'Extension',
		shortTitle: 'Extension',
		description: 'Community engagement projects, beneficiary outcomes, and the participation of faculty and students in extension work.'
	},
	{
		slug: 'faculty-development',
		title: 'Faculty Development',
		shortTitle: 'Faculty Development',
		description: 'The program’s plan for faculty qualifications, professional growth, workload, and the impact of development on instruction.'
	},
	{
		slug: 'research',
		title: 'Research',
		shortTitle: 'Research',
		description: 'Research agenda, outputs, publications, and how research feeds instruction and extension.'
	},
	{
		slug: 'linkages',
		title: 'Linkages',
		shortTitle: 'Linkages',
		description: 'Partnerships, MOAs, industry collaboration, and the evidence that linkages are active rather than ceremonial.'
	},
	{
		slug: 'library',
		title: 'Library',
		shortTitle: 'Library',
		description: 'Collections, services, and use of the library resources that support the program.'
	},
	{
		slug: 'licensure-examination',
		title: 'Licensure Examination',
		shortTitle: 'Licensure Exam',
		description: 'Graduates’ performance in the licensure examination and the program’s measures to improve it.'
	}
];

/** Mandatory areas of a level's first survey, by area slug. Unknown levels have none. */
export function mandatoryAreas(level: string): string[] {
	const roman = level.match(/\b(i{1,3}|iv|v)\b/i)?.[1].toLowerCase();
	if (roman === 'iii') return ['instruction', 'extension'];
	return [];
}

export const ADDITIONAL_SECTION = {
	slug: 'additional-documents',
	title: 'Additional documents (requested)',
	shortTitle: 'Additional documents',
	description: 'Documents the accreditors request during the visit. Add them to the “Additional documents” folder in Drive and they appear here.',
	sortOrder: 900
};
