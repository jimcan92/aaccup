<script lang="ts">
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import type { EvidenceDocument } from '$lib/data/types';
	import DocumentFormat from './document-format.svelte';

	let { document }: { document: EvidenceDocument } = $props();

	const linked = $derived(document.status === 'linked' && Boolean(document.driveUrl));
</script>

{#snippet body()}
	<span class="absolute -top-px left-5 h-2 w-20 bg-signal" aria-hidden="true"></span>
	<div class="flex items-start justify-between gap-4">
		<DocumentFormat format={document.format} />
		{#if !linked}
			<span class="border border-dashed border-ink/25 px-1.5 py-0.5 font-mono text-[9px] text-ink-soft">
				Link pending
			</span>
		{/if}
	</div>
	<h3 class="mt-5 font-display text-xl font-semibold leading-tight tracking-[-0.03em] text-ink">
		{document.title}
	</h3>
	{#if document.note}
		<p class="mt-2 text-[12px] leading-relaxed text-ink-soft">{document.note}</p>
	{/if}
	<span class="mt-6 inline-flex items-center gap-1.5 text-[10px] font-medium text-ink-soft">
		{linked ? 'Open record' : 'Awaiting link'}
		{#if linked}
			<ArrowUpRight class="size-3.5" />
		{/if}
	</span>
{/snippet}

{#if linked}
	<a
		href={document.driveUrl}
		target="_blank"
		rel="noopener noreferrer"
		class="group relative block border border-rule bg-paper p-5 pt-7 transition-colors hover:border-ink/25 hover:bg-white"
		aria-label={`${document.title} — opens in Google Drive`}
	>
		{@render body()}
	</a>
{:else}
	<div class="relative block border border-dashed border-ink/25 bg-paper p-5 pt-7">
		{@render body()}
	</div>
{/if}
