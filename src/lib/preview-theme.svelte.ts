import { mode } from 'mode-watcher';

/**
 * Light or dark for the admin's page previews, apart from the admin's own theme. The preview
 * frame gets `?theme=light|dark`; the root layout then shows that page in that theme without
 * touching the visitor's saved choice (see src/routes/+layout.svelte).
 */
class PreviewTheme {
	#chosen = $state<'light' | 'dark' | null>(null);

	/** The preview's theme: what the user picked, else the admin's current theme. */
	get current(): 'light' | 'dark' {
		return this.#chosen ?? (mode.current === 'dark' ? 'dark' : 'light');
	}

	set(value: 'light' | 'dark') {
		this.#chosen = value;
	}

	/** `src` with the preview theme added. */
	src(src: string): string {
		const url = new URL(src, 'http://local');
		url.searchParams.set('theme', this.current);
		return url.pathname + url.search + url.hash;
	}
}

export const previewTheme = new PreviewTheme();

/** The theme a page was asked to show in (?theme=light|dark), or null to follow the visitor's choice. */
export function forcedTheme(params: { get(name: string): string | null }): 'light' | 'dark' | null {
	const value = params.get('theme');
	return value === 'light' || value === 'dark' ? value : null;
}
