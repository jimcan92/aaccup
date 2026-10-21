<script lang="ts">
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import type { EvidenceDocument } from '$lib/data/types';
	import { formatDate } from '$lib/format';
	import { cn } from '$lib/utils';
	import DocumentFormat from './document-format.svelte';

	let {
		document,
		accent = '#082A2C',
		soft = '#E3E9E1',
		context,
		class: className = ''
	}: {
		document: EvidenceDocument;
		accent?: string;
		soft?: string;
		context?: string;
		class?: string;
	} = $props();

	const linked = $derived(document.status === 'linked' && Boolean(document.driveUrl));
	const date = $derived(formatDate(document.updated));
	const actionLabel = $derived(
		document.format === 'link'
			? 'Open record'
			: document.format === 'folder'
				? 'Open folder'
				: 'Open in Drive'
	);
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
					<span class="border border-dashed border-ink/25 px-1.5 py-0.5 font-mono text-[9px] text-ink-soft">
						In preparation
					</span>
				{/if}
			</div>

			{#if context}
				<p class="mt-1 text-[10px] font-medium text-ink-soft">{context}</p>
			{/if}

			{#if document.note}
				<p class="mt-1.5 max-w-xl text-[12px] leading-relaxed text-ink-soft">
					{document.note}
				</p>
			{/if}
		</div>

		<div
			class="col-start-2 flex items-center justify-between gap-4 sm:col-start-3 sm:flex-col sm:items-end sm:justify-start"
		>
			{#if date}
				<span class="font-mono text-[10px] text-ink-soft/60">{date}</span>
			{/if}
			<span
				class="inline-flex items-center gap-1 text-[10px] font-medium"
				style:color={linked ? accent : undefined}
			>
				{linked ? actionLabel : 'In preparation'}
				{#if linked}
					<ArrowUpRight class="size-3.5" />
				{/if}
			</span>
		</div>
	</div>
{/snippet}

{#if linked}
	<a
		href={document.driveUrl}
		target="_blank"
		rel="noopener noreferrer"
		class={cn(
			'block border-b border-rule px-2 py-4 transition-colors hover:bg-[var(--row-soft)] sm:px-3',
			className
		)}
		style:--row-soft={soft}
		aria-label={`${document.title} — opens in a new tab`}
	>
		{@render body()}
	</a>
{:else}
	<div
		class={cn('block border-b border-rule px-2 py-4 sm:px-3', className)}
		style:--row-soft={soft}
	>
		{@render body()}
	</div>
{/if}
