/** What a folder says when files chosen for it are no longer in Drive. */
export function missingNote(count: number): string {
	const what = count === 1 ? 'A file chosen for this folder is' : `${count} files chosen for this folder are`;
	return `${what} no longer in Drive. It may have been deleted, moved to another folder, or unshared. Choose the replacement under Admin → Documents.`;
}
