export const site = {
	name: 'CTU Moalboal',
	campus: 'Cebu Technological University — Moalboal Campus',
	shortCampus: 'CTU Moalboal',
	title: 'AACCUP Level III · CTU Moalboal',
	description:
		'The evidence dossier for the BSIE and BSFI Level III accreditation visits at Cebu Technological University — Moalboal Campus. Ten areas per program, linked to source documents in Google Drive.',
	surveyYear: 2026,
	level: 'Level III',
	address: 'Moalboal, Cebu, Philippines',
	preparedBy: 'Campus MIS Team',
	tagline: 'Two programs. One clear record.',
	intro:
		'The complete evidence dossier for the BSIE and BSFI Level III visits — organised by area, linked to source files, and built to be read at the accreditation table.',
	driveNote:
		'Every document opens in Google Drive. This site holds the index, not the files, so the evidence stays in one place.',
	contactNote:
		'For corrections, missing links, or access concerns, coordinate with the Campus AACCUP Task Force through the Office of the Campus Director.'
} as const;

export const nav = [
	{ href: '/#areas', label: 'The dossier' },
	{ href: '/documents', label: 'Documents' },
	{ href: '/resources', label: 'Resources' },
	{ href: '/about', label: 'About' }
] as const;
