import { onMount } from 'svelte';
import { MediaQuery } from 'svelte/reactivity';
import { adminUi } from '#lib/admin-ui.svelte.js';

/**
 * Where an editor's preview shows: beside the editor on wide screens (open by default,
 * remembered), a fullscreen dialog otherwise. Create it while a component initialises.
 */
export class PreviewToggle {
	#wide = new MediaQuery('min-width: 1280px', false);
	#sideOpen = $state(true);
	dialogOpen = $state(false);
	/** The side preview is showing. */
	readonly side = $derived(this.#wide.current && this.#sideOpen);
	readonly wide = $derived(this.#wide.current);

	constructor() {
		// The sidebar shrinks to icons only while the side preview is open; leaving the page restores it.
		$effect(() => {
			adminUi.compact = this.side;
			return () => (adminUi.compact = false);
		});

		onMount(() => {
			try {
				this.#sideOpen = localStorage.getItem('aaccup:preview-side') !== 'closed';
			} catch {
				// Private windows may refuse storage; the preview just starts open.
			}
		});
	}

	toggle() {
		if (!this.#wide.current) {
			this.dialogOpen = true;
			return;
		}
		this.#sideOpen = !this.#sideOpen;
		try {
			localStorage.setItem('aaccup:preview-side', this.#sideOpen ? 'open' : 'closed');
		} catch {
			// Not remembered; fine.
		}
	}
}
