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

/**
 * A candidate folder for matching. `scope` says where it was found:
 *  - 'previous': inside a previous-visit group folder ("…Findings Compliance", "Previous visit")
 *  - 'current':  inside a current-visit group folder ("…Level III Documents", "Current visit")
 *  - 'any':      directly in the root folder
 */
export type MatchFolder = { id: string; name: string; scope?: 'any' | 'previous' | 'current' };

const norm = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const ROMAN: Record<string, number> = { i: 1, v: 5, x: 10 };

function fromRoman(value: string): number | null {
	const chars = value.toLowerCase().split('');
	if (!chars.every((c) => c in ROMAN)) return null;
	let total = 0;
	chars.forEach((c, i) => {
		const current = ROMAN[c];
		const next = ROMAN[chars[i + 1]] ?? 0;
		total += current < next ? -current : current;
	});
	return total >= 1 && total <= 20 ? total : null;
}

/** "Area 3", "AREA-03", "Area III – Curriculum", "03 - Area 3 Curriculum" → 3. */
export function areaNumber(name: string): number | null {
	const match = name.match(/area[\s._-]*([0-9]{1,2}|[ivx]{1,5})(?![a-z0-9])/i);
	if (!match) return null;
	return /^\d+$/.test(match[1]) ? Number(match[1]) : fromRoman(match[1]);
}

/** Which visit a group folder holds, from its name; null when it is not a group folder. */
export function groupScope(name: string): 'previous' | 'current' | null {
	// "Area 3 – Extent of Compliance" is a section folder, not a group.
	if (areaNumber(name) !== null) return null;
	if (/previous|findings|compliance/i.test(name)) return 'previous';
	if (/current|level[\s._-]*([ivx]+|\d)\b/i.test(name)) return 'current';
	return null;
}

/**
 * Match a visit's folders to its sections. Each folder is used once. Returns sectionId → folder.
 *  - "Common…"            → the common section
 *  - "Area N" / "Area IV" → previous-visit area N (unless the folder sits in a current-visit group)
 *  - otherwise            → a current section, or a numberless previous section, by title
 * Inside a current-visit group, "Area 1 – Instruction" matches by its title, not its number.
 */
export function matchFolders(sections: MatchSection[], folders: MatchFolder[]): Map<string, MatchFolder> {
	const result = new Map<string, MatchFolder>();
	const used = new Set<string>();
	const scopeOf = (folder: MatchFolder) => folder.scope ?? 'any';
	const take = (section: MatchSection, folder: MatchFolder | undefined) => {
		if (!folder || used.has(folder.id) || result.has(section.id)) return;
		result.set(section.id, folder);
		used.add(folder.id);
	};
	const free = (folder: MatchFolder) => !used.has(folder.id);

	for (const section of sections.filter((s) => s.kind === 'common')) {
		take(section, folders.find((folder) => free(folder) && scopeOf(folder) !== 'previous' && /\bcommon\b/i.test(folder.name)));
	}

	for (const section of sections.filter((s) => s.kind === 'previous' && s.number !== null)) {
		take(
			section,
			folders.find((folder) => free(folder) && scopeOf(folder) !== 'current' && areaNumber(folder.name) === section.number)
		);
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
			folders.find((folder) => {
				if (!free(folder)) return false;
				const scope = scopeOf(folder);
				// Keep each group's folders for its own visit layer.
				if (section.kind === 'current' && scope === 'previous') return false;
				if (section.kind === 'previous' && scope === 'current') return false;
				// At the root, "Area N" folders belong to the previous-visit areas.
				if (scope === 'any' && areaNumber(folder.name) !== null) return false;
				return norm(folder.name).includes(title);
			})
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
