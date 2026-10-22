<script lang="ts">
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import X from '@lucide/svelte/icons/x';
	import { small } from './ui';

	// Move up, move down and remove for one entry in a list editor.
	let { index, count, noun, onmove, onremove }: { index: number; count: number; noun: string; onmove: (delta: number) => void; onremove: () => void } = $props();
</script>

<div class="flex gap-1 sm:flex-col">
	<button type="button" onclick={() => onmove(-1)} disabled={index === 0} class={small} aria-label={`Move ${noun} up`}><ArrowUp class="size-4" /></button>
	<button type="button" onclick={() => onmove(1)} disabled={index === count - 1} class={small} aria-label={`Move ${noun} down`}><ArrowDown class="size-4" /></button>
	<button type="button" onclick={onremove} class={small} aria-label={`Remove ${noun}`}><X class="size-4" /></button>
</div>
