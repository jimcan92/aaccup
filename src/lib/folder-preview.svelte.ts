import type { FolderEntry } from '#lib/data/types.js';

/**
 * The one file previewed inside a folder listing, shared by every folder row on the page so
 * opening a file in one folder closes the file open in another. `owner` is the folder
 * document's id.
 */
export const folderPreview = $state<{ owner: string | null; entry: FolderEntry | null }>({ owner: null, entry: null });

export function closeFolderPreview() {
	folderPreview.owner = null;
	folderPreview.entry = null;
}
