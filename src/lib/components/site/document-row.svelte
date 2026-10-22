<script lang="ts">
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import Eye from '@lucide/svelte/icons/eye';
	import { openPreview, previewUrl } from '$lib/preview';
	import type { EvidenceDocument } from '$lib/data/types';
	import { formatDate } from '$lib/format';
	import { cn } from '$lib/utils';
	import DocumentFormat from './document-format.svelte';

	let {
		document,
		context,
		class: className = ''
	}: {
		document: EvidenceDocument;
		context?: string;
		class?: string;
	} = $props();

	const linked = $derived(document.status === 'linked' && Boolean(document.driveUrl));
	const date = $derived(formatDate(document.updated));
	// Drive and Docs files open in the in-page preview; other links open in a new tab.
	const canPreview = $derived(linked && previewUrl(document.driveUrl) !== null);
	const actionLabel = $derived(
		canPreview
			? document.format === 'folder'
				? 'View folder'
				: 'Preview'
			: document.format === 'link'
				? 'Open record'
				: 'Open in Drive'
	);

	function onclick(event: MouseEvent) {
		// Ctrl/Cmd/Shift/middle click keep the browser's own "open in new tab" behaviour.
		if (!canPreview || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		event.preventDefault();
		openPreview(document.id);
	}
</script>

{#snippet body()}
	<div class="grid grid-cols-[2.5rem_1fr] gap-3 sm:grid-cols-[2.75rem_1fr_auto] sm:items-start sm:gap-4">
		<DocumentFormat format={document.format} />

		<div class="min-w-0">
			<div class="flex flex-wrap items-center gap-2">
				<h3 class="font-display text-[15px] font-semibold leading-snug tracking-[-0.015em] text-ink">
					{document.title}
				</h3>
				{#if !linked}
					<span class="border border-dashed border-ink/30 px-1.5 py-0.5 font-mono text-[11px] text-ink-soft">
						In preparation
					</span>
				{/if}
			</div>

			{#if context}
				<p class="mt-1 text-[12px] font-medium text-ink-soft">{context}</p>
			{/if}

			{#if document.note}
				<p class="mt-1.5 max-w-xl text-[13px] leading-relaxed text-ink-soft">
					{document.note}
				</p>
			{/if}
		</div>

		<div
			class="col-start-2 flex items-center justify-between gap-4 sm:col-start-3 sm:flex-col sm:items-end sm:justify-start"
		>
			{#if date}
				<span class="font-mono text-[11px] text-ink-soft">{date}</span>
			{/if}
			{#if linked}
				<span class="inline-flex items-center gap-1 text-[12px] font-medium text-program">
					{actionLabel}
					{#if canPreview}
						<Eye class="size-3.5" />
					{:else}
						<ArrowUpRight class="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
					{/if}
				</span>
			{/if}
		</div>
	</div>
{/snippet}

{#if linked}
	<a
		href={document.driveUrl}
		target="_blank"
		rel="noopener noreferrer"
		class={cn(
			'group block border-b border-rule px-2 py-4 transition-colors hover:bg-program-soft sm:px-3',
			className
		)}
		{onclick}
		aria-label={canPreview ? `Preview ${document.title}` : `${document.title} — opens in a new tab`}
	>
		{@render body()}
	</a>
{:else}
	<div class={cn('block border-b border-rule px-2 py-4 sm:px-3', className)}>
		{@render body()}
	</div>
{/if}
