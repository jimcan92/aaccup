<script lang="ts">
	import DocumentSkeleton from '#lib/components/site/document-skeleton.svelte';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Eye from '@lucide/svelte/icons/eye';
	import Folder from '@lucide/svelte/icons/folder';
	import FolderOpen from '@lucide/svelte/icons/folder-open';
	import X from '@lucide/svelte/icons/x';
	import { SvelteSet } from 'svelte/reactivity';
	import { previewUrl } from '#lib/drive-url.js';
	import { fileIcon, fileIconTone } from '#lib/file-icon.js';
	import { FolderListing, ROOT } from '#lib/folder-listing.svelte.js';
	import { formatDate } from '#lib/format.js';
	import { cn } from '#lib/utils.js';
	import type { FolderEntry } from '#lib/data/types.js';

	/**
	 * A published folder document's contents, listed right under its row: subfolders expand in
	 * place and a file opens its preview beneath it. Listing starts when the row scrolls near the
	 * screen, so a page of many folders does not ask Drive for all of them at once.
	 */
	let { documentId, title }: { documentId: string; title: string } = $props();

	// One listing per document; the row is keyed by document, so documentId does not change.
	// svelte-ignore state_referenced_locally
	const folder = new FolderListing(documentId);
	const open = new SvelteSet<string>();
	let selected = $state<FolderEntry | null>(null);
	let frameLoading = $state(true);
	let list = $state<HTMLElement | null>(null);

	$effect(() => {
		if (!list) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) return;
				observer.disconnect();
				folder.load(ROOT);
			},
			{ rootMargin: '400px' }
		);
		observer.observe(list);
		return () => observer.disconnect();
	});

	function toggleFolder(entry: FolderEntry, parent: string) {
		if (open.has(entry.id)) open.delete(entry.id);
		else {
			folder.enter(entry.id, parent);
			open.add(entry.id);
			folder.load(entry.id);
		}
	}

	function toggleFile(entry: FolderEntry) {
		if (selected?.id === entry.id) selected = null;
		else {
			selected = entry;
			frameLoading = true;
		}
	}

	// Nested levels step in under their folder; the list itself lines up with the row's title.
	const indent = (depth: number) => `${(depth - 1) * 1.25 + 0.5}rem`;
</script>

{#snippet preview(entry: FolderEntry, depth: number)}
	{@const embed = previewUrl(entry.url)}
	<div class="border-b border-rule bg-program-soft/40 pb-3 pr-2 pt-2 sm:pr-3" style:padding-left={indent(depth)}>
		<div class="mb-2 flex items-center justify-end gap-2">
			<a
				href={entry.url}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex h-8 items-center gap-1.5 border border-program/40 bg-paper px-3 text-[13px] font-medium text-program-ink transition-colors hover:bg-program-soft"
			>
				<ExternalLink class="size-3.5" />
				Open in Drive
			</a>
			<button
				type="button"
				onclick={() => (selected = null)}
				class="inline-flex h-8 items-center gap-1.5 border border-rule bg-paper px-3 text-[13px] font-medium text-ink transition-colors hover:bg-salt"
			>
				<X class="size-3.5" />
				Close
			</button>
		</div>
		<div class="relative h-[min(75vh,56rem)] overflow-hidden border border-rule bg-paper">
			{#if embed}
				{#if frameLoading}
					<DocumentSkeleton />
				{/if}
				<iframe
					src={embed}
					title={`Preview: ${entry.name}`}
					class="relative h-full w-full border-0"
					onload={() => (frameLoading = false)}
					allow="autoplay; fullscreen"
					referrerpolicy="no-referrer"
				></iframe>
			{:else}
				<p class="grid h-full place-items-center p-6 text-center text-[14px] text-ink-soft">This file cannot be shown here. Use Open in Drive.</p>
			{/if}
		</div>
	</div>
{/snippet}

{#snippet note(text: string, depth: number, tone = 'text-ink-soft')}
	<p class={cn('border-b border-rule py-2.5 pr-2 text-[13px]', tone)} style:padding-left={indent(depth)}>{text}</p>
{/snippet}

{#snippet listing(id: string, depth: number)}
	{@const items = folder.listings.get(id)}
	{#if items === 'loading' || items === undefined}
		{@render note('Loading files…', depth)}
	{:else if items === 'error'}
		<p class="border-b border-rule py-2.5 pr-2 text-[13px] text-destructive" style:padding-left={indent(depth)}>
			Could not load this folder.
			<button type="button" class="underline" onclick={() => folder.load(id)}>Try again</button>
		</p>
	{:else if items.length === 0}
		{@render note('Empty folder', depth)}
	{:else}
		<ul role={depth === 1 ? 'tree' : 'group'} aria-label={depth === 1 ? `Files in ${title}` : undefined}>
			{#each items as entry (entry.id)}
				{@const isOpen = entry.folder ? open.has(entry.id) : selected?.id === entry.id}
				{@const Icon = fileIcon(entry.mimeType)}
				{@const date = formatDate(entry.modified)}
				<li role="treeitem" aria-expanded={isOpen} aria-selected={entry.folder ? undefined : isOpen}>
					<button
						type="button"
						onclick={() => (entry.folder ? toggleFolder(entry, id) : toggleFile(entry))}
						class={cn(
							'group/file flex w-full items-center gap-2.5 border-b border-rule py-2.5 pr-2 text-left transition-colors hover:bg-program-soft sm:pr-3',
							isOpen && 'bg-program-soft'
						)}
						style:padding-left={indent(depth)}
					>
						{#if entry.folder}
							{#if isOpen}
								<FolderOpen class="size-[18px] shrink-0 text-program" />
							{:else}
								<Folder class="size-[18px] shrink-0 text-program" />
							{/if}
						{:else}
							<Icon class={cn('size-[18px] shrink-0', fileIconTone(entry.mimeType))} />
						{/if}
						<span class={cn('min-w-0 flex-1 break-words text-[14px] leading-snug text-ink', isOpen && 'font-medium text-program-ink')}>
							{entry.name}
						</span>
						{#if entry.shared === false}
							<span class="shrink-0 border border-destructive/40 px-1 font-mono text-[10.5px] text-destructive">not shared</span>
						{/if}
						{#if date}
							<span class="hidden shrink-0 font-mono text-[12px] text-ink-soft sm:inline">{date}</span>
						{/if}
						<span class="inline-flex w-[5.5rem] shrink-0 items-center justify-end gap-1 text-[13px] font-medium text-program">
							{#if entry.folder}
								{isOpen ? 'Hide' : 'Open'}
								<ChevronRight class={cn('size-3.5 transition-transform', isOpen && 'rotate-90')} />
							{:else if isOpen}
								Hide
								<ChevronDown class="size-3.5 rotate-180" />
							{:else}
								Preview
								<Eye class="size-3.5" />
							{/if}
						</span>
					</button>
					{#if entry.folder && isOpen}
						{@render listing(entry.id, depth + 1)}
					{:else if isOpen}
						{@render preview(entry, depth)}
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
{/snippet}

<div bind:this={list} class="pb-3 pl-[3.25rem] sm:pl-[4.25rem]">
	{@render listing(ROOT, 1)}
</div>
