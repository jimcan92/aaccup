import { SvelteMap } from 'svelte/reactivity';
import type { FolderEntry } from '#lib/data/types.js';

export type Listing = FolderEntry[] | 'loading' | 'error';

/** The document's own folder, as a key in the listings. */
export const ROOT = '';

/**
 * Contents of a published folder document, fetched one level at a time through
 * /api/drive-folder. Subfolders are named to the server by their chain of ids below the
 * document's folder, which it checks before listing.
 */
export class FolderListing {
	readonly listings = new SvelteMap<string, Listing>();
	// Folder id → its chain of folder ids below the document's folder.
	readonly #paths = new Map<string, string[]>([[ROOT, []]]);

	constructor(readonly documentId: string) {}

	/** Remembers where a subfolder sits, so it can be listed later. */
	enter(folder: string, parent: string) {
		this.#paths.set(folder, [...(this.#paths.get(parent) ?? []), folder]);
	}

	async load(folder: string): Promise<FolderEntry[] | null> {
		const current = this.listings.get(folder);
		if (Array.isArray(current)) return current;
		if (current === 'loading') return null;
		this.listings.set(folder, 'loading');
		try {
			const params = new URLSearchParams({ doc: this.documentId });
			const path = this.#paths.get(folder) ?? [];
			if (path.length) params.set('path', path.join(','));
			const response = await fetch(`/api/drive-folder?${params}`);
			if (!response.ok) throw new Error(String(response.status));
			const entries = (await response.json()) as FolderEntry[];
			this.listings.set(folder, entries);
			return entries;
		} catch {
			this.listings.set(folder, 'error');
			return null;
		}
	}
}
