<script lang="ts">
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Eye from '@lucide/svelte/icons/eye';
	import X from '@lucide/svelte/icons/x';
	import { browser } from '$app/env';
	import { isLinked } from '#lib/drive-url.js';
	import { closePreview, currentPreviewId, openPreview, previewUrl, wideScreen } from '#lib/preview.js';
	import type { EvidenceDocument } from '#lib/data/types.js';
	import { formatDate } from '#lib/format.js';
	import { cn } from '#lib/utils.js';
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

	// Only Drive/Docs files count as linked; other links show as In preparation.
	const linked = $derived(isLinked(document));
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

	const embed = $derived(canPreview ? previewUrl(document.driveUrl) : null);
	// Wide screens expand the preview in place; narrow screens use the full-screen panel.
	const expanded = $derived(browser && canPreview && wideScreen.current && currentPreviewId() === document.id);
	let row = $state<HTMLAnchorElement | null>(null);
	let loading = $state(true);

	$effect(() => {
		if (!expanded) return;
		loading = true;
		// Opened from a shared link further down the page: bring it into view.
		row?.scrollIntoView({ block: 'nearest' });
	});

	function onclick(event: MouseEvent) {
		// Ctrl/Cmd/Shift/middle click keep the browser's own "open in new tab" behaviour.
		if (!canPreview || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		event.preventDefault();
		if (expanded) closePreview();
		else openPreview(document.id);
	}
</script>

{#snippet body()}
	<div class="grid grid-cols-[2.5rem_1fr] gap-3 sm:grid-cols-[2.75rem_1fr_auto] sm:items-start sm:gap-4">
		<DocumentFormat format={document.format} />

		<div class="min-w-0">
			<div class="flex flex-wrap items-center gap-2">
				{#if document.code}
					<span class="border border-program/35 px-1.5 py-0.5 font-mono text-[11px] text-program-ink">{document.code}</span>
				{/if}
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
					{expanded ? 'Hide preview' : actionLabel}
					{#if expanded}
						<ChevronDown class="size-3.5 rotate-180" />
					{:else if canPreview}
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
	<div class={cn(expanded && 'border-b border-program/40 bg-program-soft/40')}>
		<a
			bind:this={row}
			href={document.driveUrl}
			target="_blank"
			rel="noopener noreferrer"
			class={cn('group block border-b border-rule px-2 py-4 transition-colors hover:bg-program-soft sm:px-3', expanded && 'border-program/30 bg-program-soft', className)}
			onclick={onclick}
			aria-expanded={canPreview && wideScreen.current ? expanded : undefined}
			aria-label={canPreview ? `${expanded ? 'Hide preview of' : 'Preview'} ${document.title}` : `${document.title} — opens in a new tab`}
		>
			{@render body()}
		</a>

		{#if expanded && embed}
			<div class="px-2 pb-4 pt-3 sm:px-3">
				<div class="mb-2 flex items-center justify-end gap-2">
					<a
						href={document.driveUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex h-8 items-center gap-1.5 border border-program/40 bg-paper px-3 text-[12px] font-medium text-program-ink transition-colors hover:bg-program-soft"
					>
						<ExternalLink class="size-3.5" />
						Open in Drive
					</a>
					<button
						type="button"
						onclick={closePreview}
						class="inline-flex h-8 items-center gap-1.5 border border-rule bg-paper px-3 text-[12px] font-medium text-ink transition-colors hover:bg-salt"
					>
						<X class="size-3.5" />
						Close
					</button>
				</div>
				<div class="relative h-[min(75vh,56rem)] overflow-hidden border border-rule bg-paper">
					{#if loading}
						<p class="absolute inset-0 grid place-items-center text-[13px] text-ink-soft" aria-live="polite">Loading preview…</p>
					{/if}
					<iframe
						src={embed}
						title={`Preview: ${document.title}`}
						class="relative h-full w-full border-0"
						onload={() => loading = false}
						allow="autoplay; fullscreen"
						referrerpolicy="no-referrer"
					></iframe>
				</div>
				<p class="mt-2 text-[12px] text-ink-soft">
					If the preview asks for access, the file is not shared as “Anyone with the link”. Use Open in Drive or contact the task force.
				</p>
			</div>
		{/if}
	</div>
{:else}
	<div class={cn('block border-b border-rule px-2 py-4 sm:px-3', className)}>
		{@render body()}
	</div>
{/if}
