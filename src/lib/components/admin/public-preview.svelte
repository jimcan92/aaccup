<script lang="ts">
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import type { Snippet } from 'svelte';
	import PreviewDialog from '#lib/components/admin/preview-dialog.svelte';
	import PreviewPane from '#lib/components/admin/preview-pane.svelte';
	import { pageBar, type BarAction } from '#lib/page-bar.svelte.js';
	import { PreviewToggle } from '#lib/preview-toggle.svelte.js';

	// A Documents page beside the public page it manages, as published. Puts the page's buttons
	// and a Preview toggle in the program's sticky bar; `children` learns whether the preview is beside it.
	let { src, hint, actions = [], children }: { src: string; hint: string; actions?: BarAction[]; children: Snippet<[boolean]> } = $props();

	const preview = new PreviewToggle();
	// The public page is cached at the edge; a fresh mark shows the latest. Only rendered in the browser.
	const frameSrc = $derived(`${src}${src.includes('?') ? '&' : '?'}fresh=${Date.now()}`);

	$effect(() => {
		const toggle: BarAction = { id: 'preview', label: preview.side ? 'Hide preview' : 'Preview', icon: preview.side ? EyeOff : Eye, onclick: () => preview.toggle(), pressed: preview.side };
		pageBar.actions = [...actions.filter((action) => !action.primary), toggle, ...actions.filter((action) => action.primary)];
		return () => (pageBar.actions = []);
	});
</script>

<div class={preview.side ? 'grid grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-8' : ''}>
	<div class="min-w-0">{@render children(preview.side)}</div>
	{#if preview.side}
		<PreviewPane src={frameSrc} hint={`Preview · ${hint}`} />
	{/if}
</div>

<PreviewDialog src={frameSrc} hint={`${hint[0].toUpperCase()}${hint.slice(1)}.`} bind:open={preview.dialogOpen} />
