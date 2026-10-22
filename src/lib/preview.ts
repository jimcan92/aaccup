import { pushState, replaceState } from '$app/navigation';
import { page } from '$app/state';
import { MediaQuery } from 'svelte/reactivity';

export { previewUrl } from '$lib/drive-url';

/** Wide screens expand the preview inside the list; narrow screens use a full-screen panel. */
export const wideScreen = new MediaQuery('min-width: 1024px', false);

/**
 * In-page document preview. The open document lives in the URL (?doc=<id>) so a preview can
 * be shared, and in SvelteKit's shallow-routing state so the browser's Back button closes it
 * without reloading the page.
 */

/** The previewed document id: from shallow state after a click, or from ?doc= on a shared link. */
export function currentPreviewId(): string | null {
	return page.state.doc ?? page.url.searchParams.get('doc');
}

function urlWith(id: string | null): URL {
	const url = new URL(page.url);
	if (id) url.searchParams.set('doc', id);
	else url.searchParams.delete('doc');
	return url;
}

export function openPreview(id: string) {
	// One history entry per preview session: opening another document while one is open
	// replaces it, so Close or Back always returns to the page without a preview.
	if (currentPreviewId()) switchPreview(id);
	else pushState(urlWith(id), { doc: id });
}

/** Moving between documents replaces the entry, so one Back still closes the preview. */
export function switchPreview(id: string) {
	replaceState(urlWith(id), { doc: id, opened: page.state.opened ?? !!page.state.doc });
}

export function closePreview() {
	// Opened by a click on this page: step back. Opened from a shared link: just drop ?doc.
	if (page.state.doc && page.state.opened !== false) history.back();
	else replaceState(urlWith(null), {});
}
