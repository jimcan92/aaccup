export const site = {
	name: 'CTU Moalboal',
	campus: 'Cebu Technological University — Moalboal Campus',
	shortCampus: 'CTU Moalboal',
	title: 'AACCUP 2026 · CTU Moalboal',
	description:
		'The BSIE and BSFI dossiers for the AACCUP Level III visit at Cebu Technological University — Moalboal Campus. Current visit areas, previous-visit recommendations, and shared records, linked to Google Drive.',
	surveyYear: 2026,
	level: 'Level III visit',
	statusNote: 'Applying for Level III accreditation',
	address: 'Poblacion West, Moalboal, Cebu 6032',
	phone: '(032) 474-8196 loc. 1602',
	email: 'cdmoalboal@ctu.edu.ph',
	website: 'https://www.ctu.edu.ph/moalboal/',
	preparedBy: 'Campus MIS Team',
	tagline: 'Two volumes. One campus.',
	intro:
		'Choose the BSIE or BSFI dossier. Each volume carries its own current visit, its previous 10-area recommendations, and its record of evidence.',
	driveNote:
		'Evidence opens in Google Drive. This site holds the index, not the files, so the record stays in one place.',
	contactNote:
		'For corrections, missing links, or access concerns, coordinate with the Campus AACCUP Task Force through the Office of the Campus Director.'
} as const;

export const vmgo = {
	vision:
		'CTU as a premier, inclusive, globally recognized research and innovation, smart, community-responsive, and sustainable technological university.',
	mission:
		'The University shall primarily provide learning-edge degree programs, innovative, professional, entrepreneurial, and technical instruction as well as research, extension and resource generation programs that address both the needs of the region and the nation in the context of the global knowledge economy, Fifth Industrial Revolution, and sustainability.',
	source: 'https://www.ctu.edu.ph/moalboal/about/vmgo/',
	sourceLabel: 'Official CTU Moalboal VMGO'
} as const;

export const campusUpdates = [
	{
		src: 'https://www.ctu.edu.ph/moalboal/wp-content/uploads/sites/47/2026/04/4-1300x869.png',
		alt: 'CTU Moalboal strategic planning orientation',
		caption: 'Charting the path to 2030',
		meta: 'University strategic planning · April 2026'
	},
	{
		src: 'https://www.ctu.edu.ph/moalboal/wp-content/uploads/sites/47/2026/03/Copy-of-Untitled-1.png',
		alt: 'CTU Moalboal delegates at the SUGBOHOL 2026 solidarity meeting',
		caption: 'SUGBOHOL 2026 solidarity meeting',
		meta: 'Regional assembly · March 2026'
	},
	{
		src: 'https://www.ctu.edu.ph/moalboal/wp-content/uploads/sites/47/2025/08/3-14.png',
		alt: 'Recognition Day and stakeholders engagement at CTU Moalboal',
		caption: 'Recognition Day and stakeholders’ engagement',
		meta: 'Campus honors and partnerships · August 2025'
	}
] as const;

export const homeNav = [
	{ href: '/#visit', label: 'The visit' },
	{ href: '/#vmgo', label: 'VMGO' },
	{ href: '/#records', label: 'Records' },
	{ href: '/#campus', label: 'Campus' }
] as const;
