/**
 * Pure helpers for the Drive sync: no network, no database, so they are easy to test.
 */

export type MatchSection = {
	id: string;
	kind: 'common' | 'current' | 'previous';
	number: number | null;
	title: string;
	short_title: string | null;
};

export type MatchFolder = { id: string; name: string };

const norm = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** "Area 3", "AREA-03", "03 - Area 3 Curriculum" → 3. */
export function areaNumber(name: string): number | null {
	const match = name.match(/area[\s._-]*0*(\d{1,2})(?!\d)/i);
	return match ? Number(match[1]) : null;
}

/**
 * Match a visit's subfolders to its sections.
 *  - "Common…" folder → the common section
 *  - "Area N…" folder → previous-visit area N
 *  - remaining folders → current sections and numberless previous sections by title
 * Each folder is used once. Returns sectionId → folder.
 */
export function matchFolders(sections: MatchSection[], folders: MatchFolder[]): Map<string, MatchFolder> {
	const result = new Map<string, MatchFolder>();
	const used = new Set<string>();
	const take = (section: MatchSection, folder: MatchFolder | undefined) => {
		if (!folder || used.has(folder.id) || result.has(section.id)) return;
		result.set(section.id, folder);
		used.add(folder.id);
	};

	for (const section of sections.filter((s) => s.kind === 'common')) {
		take(section, folders.find((folder) => /\bcommon\b/i.test(folder.name)));
	}

	for (const section of sections.filter((s) => s.kind === 'previous' && s.number !== null)) {
		take(section, folders.find((folder) => !used.has(folder.id) && areaNumber(folder.name) === section.number));
	}

	// Longer titles first, so "Extension and Community Involvement" is not taken by "Extension".
	const byTitle = sections
		.filter((s) => !result.has(s.id) && s.kind !== 'common')
		.flatMap((section) =>
			[section.title, section.short_title].filter(Boolean).map((title) => ({ section, title: norm(title!) }))
		)
		.sort((a, b) => b.title.length - a.title.length);

	for (const { section, title } of byTitle) {
		take(
			section,
			folders.find((folder) => !used.has(folder.id) && areaNumber(folder.name) === null && norm(folder.name).includes(title))
		);
	}

	return result;
}

/** File name without a known office/PDF extension, tidy spaces. */
export function titleFromName(name: string): string {
	return name.replace(/\.(pdf|docx?|xlsx?|pptx?|csv|txt|jpe?g|png)$/i, '').replace(/[_\s]+/g, ' ').trim() || name;
}

/** Guess the document kind from its name; common-section files default to institutional. */
export function kindFromName(name: string, sectionKind: MatchSection['kind']): string {
	const n = name.toLowerCase();
	if (/recommend/.test(n)) return 'recommendation';
	if (/complian/.test(n)) return 'compliance';
	if (/narrative|profile/.test(n)) return 'narrative';
	if (/checklist/.test(n)) return 'checklist';
	if (/presentation|slides|\bppt\b/.test(n)) return 'presentation';
	if (/\bform\b/.test(n)) return 'form';
	if (sectionKind === 'common' || /certif|resolution|\bbor\b|copc/.test(n)) return 'institutional';
	return 'supporting';
}
