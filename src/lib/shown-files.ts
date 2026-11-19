/**
 * A folder document's chosen items (documents.shown_files). Each entry is the chain of Drive ids
 * from the document's folder down to the chosen item, joined by "/": "fileId" for a file at the
 * top, "subfolderId/fileId" for one inside a subfolder. A chosen folder shows everything in it.
 */

const ID = /^[\w-]{10,}$/;
/** The folder API lists at most 8 subfolders deep, plus the item itself. */
const MAX_DEPTH = 9;

export const joinPath = (path: string[]) => path.join('/');

/** A valid entry: 1–9 Drive ids joined by "/". */
export function isShownPath(value: string): boolean {
	const parts = value.split('/');
	return parts.length <= MAX_DEPTH && parts.every((part) => ID.test(part));
}

const startsWith = (path: string[], prefix: string[]) =>
	prefix.length <= path.length && prefix.every((id, i) => path[i] === id);

export type LevelRule =
	/** Show everything at this level (no choice, or inside a chosen folder). */
	| { kind: 'all' }
	/** Show only these ids: chosen items, and folders that lead to chosen items. */
	| { kind: 'some'; ids: Set<string> }
	/** This folder is neither chosen nor on the way to a chosen item. */
	| { kind: 'closed' };

/** What a folder at `path` (ids below the document's folder) may list, given the chosen entries. */
export function levelRule(shown: string[] | null | undefined, path: string[]): LevelRule {
	if (!shown) return { kind: 'all' };
	const chosen = shown.map((entry) => entry.split('/'));
	if (chosen.some((entry) => startsWith(path, entry))) return { kind: 'all' };
	const below = chosen.filter((entry) => entry.length > path.length && startsWith(entry, path));
	if (!below.length) return { kind: 'closed' };
	return { kind: 'some', ids: new Set(below.map((entry) => entry[path.length])) };
}
