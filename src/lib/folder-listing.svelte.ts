import { SvelteMap } from 'svelte/reactivity';
import type { FolderEntry } from '#lib/data/types.js';

export type Listing = FolderEntry[] | 'loading' | 'error';

/** The document's own folder, as a key in the listings. */
export const ROOT = '';

/**
 * Contents of a published folder document, fetched one level at a time through
 * /api/drive-folder. Subfolders are named to the server by their chain of ids below the
 * document's folder, which it checks before listing. With `preview`, a signed-in staff
 * member can also list an unpublished folder document (review before publishing).
 */
export class FolderListing {
	readonly listings = new SvelteMap<string, Listing>();
	/** Folder id → how many of its chosen files are no longer in Drive. */
	readonly missing = new SvelteMap<string, number>();
	// Folder id → its chain of folder ids below the document's folder.
	readonly #paths = new Map<string, string[]>([[ROOT, []]]);

	constructor(
		readonly documentId: string,
		readonly preview = false,
		/** Staff only: ignore the document's chosen files and list the whole folder. */
		readonly all = false,
		/** Staff only: an unsaved choice to preview (null = the whole folder); undefined uses the saved one. */
		readonly shown: string[] | null | undefined = undefined
	) {}

	/** A folder's chain of ids below the document's folder ([] for the document's folder). */
	pathOf(folder: string): string[] {
		return this.#paths.get(folder) ?? [];
	}

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
			if (this.preview || this.all) params.set('preview', '1');
			if (this.all) params.set('all', '1');
			if (this.shown !== undefined) params.set('shown', this.shown === null ? '*' : this.shown.join(','));
			const response = await fetch(`/api/drive-folder?${params}`);
			if (!response.ok) throw new Error(String(response.status));
			const all = (await response.json()) as FolderEntry[];
			const entries = all.filter((entry) => !entry.missing);
			this.missing.set(folder, all.length - entries.length);
			this.listings.set(folder, entries);
			return entries;
		} catch {
			this.listings.set(folder, 'error');
			return null;
		}
	}
}
