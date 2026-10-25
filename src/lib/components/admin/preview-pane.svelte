<script lang="ts">
	import Monitor from '@lucide/svelte/icons/monitor';
	import Smartphone from '@lucide/svelte/icons/smartphone';
	import PreviewSkeleton from '#lib/components/admin/preview-skeleton.svelte';

	// The side preview beside an editor: a sticky pane with a desktop/phone switch around the preview frame.
	let { src, hint, frame = $bindable() }: { src: string; hint: string; frame?: HTMLIFrameElement } = $props();

	let device = $state<'desktop' | 'phone'>('desktop');
	// The frame shows a skeleton until its page has loaded; the pane is remounted when reopened.
	let loading = $state(true);
	let paneWidth = $state(0);
	let paneHeight = $state(0);

	// Desktop preview: a 1280px-wide page scaled down to fit the pane.
	const scale = $derived(device === 'desktop' && paneWidth ? Math.min(1, paneWidth / 1280) : 1);
</script>

<!-- Below any sticky bars above it (--sticky-offset, set by the program layout). -->
<aside class="sticky top-[calc(var(--sticky-offset,0px)+1rem)] flex h-[calc(100dvh-var(--sticky-offset,0px)-2rem)] flex-col self-start border border-rule bg-paper" aria-label="Page preview">
	<div class="flex items-center gap-2 border-b border-rule px-3 py-2">
		<p class="mr-auto text-[12px] text-ink-soft">{hint}</p>
		{#each [{ value: 'desktop', label: 'Desktop', icon: Monitor }, { value: 'phone', label: 'Phone', icon: Smartphone }] as option (option.value)}
			{@const Icon = option.icon}
			<button type="button" onclick={() => (device = option.value as 'desktop' | 'phone')} class="grid size-8 cursor-pointer place-items-center {device === option.value ? 'bg-ink text-paper' : 'text-ink-soft hover:bg-salt hover:text-ink'}" aria-pressed={device === option.value} title={option.label}>
				<Icon class="size-4" /><span class="sr-only">{option.label}</span>
			</button>
		{/each}
	</div>
	<div bind:clientWidth={paneWidth} bind:clientHeight={paneHeight} class="relative min-h-0 flex-1 overflow-hidden {device === 'phone' ? 'flex justify-center bg-salt' : ''}">
		<iframe bind:this={frame} {src} title="Page preview" onload={() => (loading = false)} class="border-0 bg-salt" style={device === 'desktop' ? `width: 1280px; height: ${paneHeight / scale}px; transform: scale(${scale}); transform-origin: top left;` : 'width: 390px; height: 100%;'}></iframe>
		{#if loading}<PreviewSkeleton />{/if}
	</div>
</aside>
