<script lang="ts">
	import DocumentSkeleton from '#lib/components/site/document-skeleton.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import FileText from '@lucide/svelte/icons/file-text';
	import Folder from '@lucide/svelte/icons/folder';
	import FolderOpen from '@lucide/svelte/icons/folder-open';
	import Image from '@lucide/svelte/icons/image';
	import { untrack } from 'svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { previewUrl } from '#lib/drive-url.js';
	import { cn } from '#lib/utils.js';
	import type { FolderEntry } from '#lib/data/types.js';

	/**
	 * Browses a published folder document in the page: folders expand in place (one level is
	 * fetched at a time), files open in the preview pane. Listing goes through /api/drive-folder.
	 */
	let { documentId, title }: { documentId: string; title: string } = $props();

	type Listing = FolderEntry[] | 'loading' | 'error';
	const ROOT = '';
	const listings = new SvelteMap<string, Listing>();
	const open = new SvelteSet<string>();
	let selected = $state<FolderEntry | null>(null);
	let frameLoading = $state(true);

	async function load(folder: string) {
		const current = listings.get(folder);
		if (current && current !== 'error') return;
		listings.set(folder, 'loading');
		try {
			const params = new URLSearchParams({ doc: documentId });
			if (folder) params.set('folder', folder);
			const response = await fetch(`/api/drive-folder?${params}`);
			if (!response.ok) throw new Error(String(response.status));
			listings.set(folder, (await response.json()) as FolderEntry[]);
		} catch {
			listings.set(folder, 'error');
		}
	}

	$effect(() => {
		// A different document starts from a fresh root. Only documentId is tracked: load()
		// reads and writes `listings`, which would otherwise re-run this effect in a loop.
		void documentId;
		untrack(() => {
			listings.clear();
			open.clear();
			selected = null;
			load(ROOT);
		});
	});

	function toggle(entry: FolderEntry) {
		if (open.has(entry.id)) open.delete(entry.id);
		else {
			open.add(entry.id);
			load(entry.id);
		}
	}

	function choose(entry: FolderEntry) {
		selected = entry;
		frameLoading = true;
	}

	const embed = $derived(selected ? previewUrl(selected.url) : null);
	const isImage = (entry: FolderEntry) => entry.mimeType.startsWith('image/');
</script>

{#snippet listing(folder: string, depth: number)}
	{@const items = listings.get(folder)}
	{#if items === 'loading' || items === undefined}
		<p class="py-1.5 font-mono text-[12px] text-ink-soft" style:padding-left={`${depth * 1 + 0.5}rem`}>Loading…</p>
	{:else if items === 'error'}
		<p class="py-1.5 text-[12px] text-destructive" style:padding-left={`${depth * 1 + 0.5}rem`}>
			Could not load this folder.
			<button type="button" class="underline" onclick={() => load(folder)}>Try again</button>
		</p>
	{:else if items.length === 0}
		<p class="py-1.5 text-[12px] text-ink-soft" style:padding-left={`${depth * 1 + 0.5}rem`}>Empty folder</p>
	{:else}
		<ul role={depth === 0 ? 'tree' : 'group'} aria-label={depth === 0 ? `Files in ${title}` : undefined}>
			{#each items as entry (entry.id)}
				<li role="treeitem" aria-expanded={entry.folder ? open.has(entry.id) : undefined} aria-selected={selected?.id === entry.id}>
					<button
						type="button"
						onclick={() => (entry.folder ? toggle(entry) : choose(entry))}
						class={cn(
							'flex w-full items-center gap-1.5 py-1.5 pr-2 text-left text-[13px] leading-snug transition-colors hover:bg-program-soft',
							selected?.id === entry.id && 'bg-program-soft font-medium text-program-ink'
						)}
						style:padding-left={`${depth * 1 + 0.5}rem`}
					>
						{#if entry.folder}
							<ChevronRight class={cn('size-3.5 shrink-0 text-ink-soft transition-transform', open.has(entry.id) && 'rotate-90')} />
							{#if open.has(entry.id)}
								<FolderOpen class="size-4 shrink-0 text-program" />
							{:else}
								<Folder class="size-4 shrink-0 text-program" />
							{/if}
						{:else}
							<span class="size-3.5 shrink-0"></span>
							{#if isImage(entry)}
								<Image class="size-4 shrink-0 text-ink-soft" />
							{:else}
								<FileText class="size-4 shrink-0 text-ink-soft" />
							{/if}
						{/if}
						<span class="min-w-0 flex-1 break-words">{entry.name}</span>
						{#if entry.shared === false}
							<span class="shrink-0 border border-destructive/40 px-1 font-mono text-[10.5px] text-destructive">not shared</span>
						{/if}
					</button>
					{#if entry.folder && open.has(entry.id)}
						{@render listing(entry.id, depth + 1)}
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
{/snippet}

<div class="flex h-full min-h-0 flex-col md:flex-row">
	<!-- Narrow screens show the tree or the file, not both. -->
	<nav class={cn('min-h-0 overflow-y-auto border-rule py-2 md:w-80 md:shrink-0 md:border-r', selected ? 'hidden md:block' : 'flex-1 md:flex-none')}>
		{@render listing(ROOT, 0)}
	</nav>

	<div class={cn('relative min-h-0 flex-1 flex-col', selected ? 'flex' : 'hidden md:flex')}>
		{#if selected}
			<div class="flex items-center gap-2 border-b border-rule px-3 py-2">
				<button type="button" onclick={() => (selected = null)} class="grid size-8 place-items-center hover:bg-salt md:hidden" aria-label="Back to files">
					<ArrowLeft class="size-4" />
				</button>
				<p class="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">{selected.name}</p>
				<a
					href={selected.url}
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex h-8 shrink-0 items-center gap-1.5 border border-rule px-2.5 text-[12px] font-medium text-ink transition-colors hover:bg-salt"
				>
					<ExternalLink class="size-3.5" />
					Open
				</a>
			</div>
			<div class="relative min-h-0 flex-1">
				{#if embed}
					{#key embed}
						{#if frameLoading}
							<DocumentSkeleton />
						{/if}
						<iframe
							src={embed}
							title={`Preview: ${selected.name}`}
							class="relative h-full w-full border-0"
							onload={() => (frameLoading = false)}
							allow="autoplay; fullscreen"
							referrerpolicy="no-referrer"
						></iframe>
					{/key}
				{:else}
					<p class="grid h-full place-items-center p-6 text-center text-[14px] text-ink-soft">This file cannot be shown here. Use Open.</p>
				{/if}
			</div>
		{:else}
			<p class="grid h-full place-items-center p-6 text-center text-[14px] text-ink-soft">Choose a file on the left to preview it.</p>
		{/if}
	</div>
</div>
