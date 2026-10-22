/**
 * Suggested Google Drive folder names for a visit's sections. They follow the rules the
 * sync uses to match subfolders of the root folder (see src/lib/server/drive-match.ts):
 * "Common…" → common documents, "Area N…" → previous-visit area N, otherwise the section title.
 */

export type NamedSection = {
	kind: 'common' | 'current' | 'previous' | string;
	number: number | null;
	title: string;
	short_title: string | null;
};

const pad2 = (value: number) => String(value).padStart(2, '0');

export function expectedFolderName(section: NamedSection): string {
	if (section.kind === 'common') return '00 Common documents';
	if (section.kind === 'previous' && section.number) return `Area ${section.number} — ${section.short_title || section.title}`;
	if (section.kind === 'current' && section.number) return `${pad2(section.number)} ${section.title}`;
	return section.title;
}

/** Plain-text folder tree for the naming guide's Copy button. */
export function folderTree(rootName: string, sections: NamedSection[]): string {
	const current = sections.filter((s) => s.kind !== 'previous' || !s.number);
	const areas = sections.filter((s) => s.kind === 'previous' && s.number);
	const lines = [rootName, ...current.map((s) => `├── ${expectedFolderName(s)}`)];
	if (areas.length) {
		lines.push('└── Previous visit');
		areas.forEach((s, index) => lines.push(`    ${index === areas.length - 1 ? '└──' : '├──'} ${expectedFolderName(s)}`));
	}
	return lines.join('\n');
}
