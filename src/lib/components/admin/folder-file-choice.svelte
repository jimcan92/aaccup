<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { fileIcon, fileIconTone } from '#lib/file-icon.js';
	import { FolderListing, ROOT } from '#lib/folder-listing.svelte.js';
	import { formatDate } from '#lib/format.js';
	import { joinPath } from '#lib/shown-files.js';
	import { cn } from '#lib/utils.js';
	import type { FolderEntry } from '#lib/data/types.js';

	/**
	 * Form fields (mode + files) choosing which items of a folder document's Drive folder the
	 * public site lists: the whole folder, or only the checked items (e.g. the compiled PDF and
	 * not its drafts). Subfolders expand, so a single file deep inside can be chosen; checking a
	 * folder shows everything in it. Values are id paths (see shown-files.ts). Lists the whole
	 * folder (staff-only `all`), whatever is chosen now.
	 */
	let {
		documentId,
		shown,
		compact = false,
		onchange
	}: { documentId: string; shown: string[] | null; compact?: boolean; /** The choice as it stands, saved or not (null = whole folder). */ onchange?: (shown: string[] | null) => void } = $props();

	// svelte-ignore state_referenced_locally
	const folder = new FolderListing(documentId, true, true);
	// svelte-ignore state_referenced_locally
	let mode = $state<'all' | 'some'>(shown ? 'some' : 'all');
	// svelte-ignore state_referenced_locally
	let checked = $state<string[]>(shown ?? []);
	const open = new SvelteSet<string>();

	const root = $derived(folder.listings.get(ROOT));
	// Chosen items whose top-level item left the folder (moved or deleted in Drive): not resent.
	const kept = $derived(
		Array.isArray(root) ? checked.filter((path) => root.some((entry) => entry.id === path.split('/')[0])) : checked
	);
	const gone = $derived(checked.length - kept.length);

	// Tell the review preview what is chosen now, before it is saved.
	$effect(() => {
		const value = mode === 'all' ? null : [...kept];
		untrack(() => onchange?.(value));
	});

	// Once, on open: untracked, so a later listing or a collapsed folder does not rerun it.
	$effect(() =>
		untrack(() => {
			folder.load(ROOT);
			// Open the folders that lead to chosen items, so the choice is visible.
			for (const path of shown ?? []) {
				const ids = path.split('/');
				for (let depth = 0; depth < ids.length - 1; depth++) expand(ids[depth], depth ? ids[depth - 1] : ROOT);
			}
		})
	);

	function expand(id: string, parent: string) {
		folder.enter(id, parent);
		open.add(id);
		folder.load(id);
	}

	function toggleOpen(entry: FolderEntry, parent: string) {
		if (open.has(entry.id)) open.delete(entry.id);
		else expand(entry.id, parent);
	}

	/** Checked through a chosen folder above it. */
	const inherited = (path: string) => checked.some((chosen) => path.startsWith(`${chosen}/`));
	const chosenInside = (path: string) => checked.filter((chosen) => chosen.startsWith(`${path}/`)).length;

	function toggle(path: string, on: boolean) {
		// Checking a folder covers what is inside it, so its own inner choices fold into it.
		checked = on ? [...checked.filter((chosen) => !chosen.startsWith(`${path}/`)), path] : checked.filter((chosen) => chosen !== path);
	}

	const indent = (depth: number) => `${depth * 1.25}rem`;
</script>

{#snippet level(folderId: string, depth: number)}
	{@const listing = folder.listings.get(folderId)}
	{#if listing === undefined || listing === 'loading'}
		<li class="py-2 text-[13px] text-ink-soft" style:padding-left={indent(depth)}>Reading the Drive folder…</li>
	{:else if listing === 'error'}
		<li class="py-2 text-[13px] text-destructive" style:padding-left={indent(depth)}>Could not read this folder. Try again later.</li>
	{:else if listing.length === 0}
		<li class="py-2 text-[13px] text-ink-soft" style:padding-left={indent(depth)}>Empty folder.</li>
	{:else}
		{#each listing as entry (entry.id)}
			{@const path = joinPath([...folder.pathOf(folderId), entry.id])}
			{@const fromAbove = inherited(path)}
			{@const inside = entry.folder ? chosenInside(path) : 0}
			{@const Icon = fileIcon(entry.mimeType)}
			<li class="border-b border-rule">
				<div class="flex items-center gap-2 py-2 text-[13px]" style:padding-left={indent(depth)}>
					{#if entry.folder}
						<button
							type="button"
							onclick={() => toggleOpen(entry, folderId)}
							class="grid size-6 shrink-0 place-items-center hover:bg-salt"
							aria-expanded={open.has(entry.id)}
							aria-label={`${open.has(entry.id) ? 'Collapse' : 'Expand'} ${entry.name}`}
						>
							<ChevronRight class={cn('size-4 transition-transform', open.has(entry.id) && 'rotate-90')} />
						</button>
					{:else}
						<span class="size-6 shrink-0"></span>
					{/if}
					<label class="flex min-w-0 flex-1 items-center gap-2.5">
						<input
							type="checkbox"
							checked={fromAbove || checked.includes(path)}
							disabled={mode === 'all' || fromAbove}
							onchange={(event) => toggle(path, event.currentTarget.checked)}
						/>
						<Icon class="size-4 shrink-0 {fileIconTone(entry.mimeType)}" />
						<span class={cn('min-w-0 flex-1', compact ? 'break-words' : 'truncate')}>
							{entry.name}
							{#if inside}<span class="text-[12px] text-program-ink"> · {inside} chosen inside</span>{/if}
						</span>
						{#if !compact}<span class="font-mono text-[11px] text-ink-soft">{formatDate(entry.modified)}</span>{/if}
					</label>
				</div>
			</li>
			{#if entry.folder && open.has(entry.id)}
				{@render level(entry.id, depth + 1)}
			{/if}
		{/each}
	{/if}
{/snippet}

<fieldset class="grid gap-1.5 text-[13px]">
	<legend class="mb-1 font-medium">What visitors see inside this folder</legend>
	<label class="flex items-center gap-2"><input type="radio" name="mode" value="all" bind:group={mode} /> The whole folder</label>
	<label class="flex items-center gap-2"><input type="radio" name="mode" value="some" bind:group={mode} /> Only the files checked below</label>
</fieldset>

<ul class={cn('border-t border-rule', compact && 'max-h-80 overflow-y-auto', mode === 'all' && 'opacity-50')}>
	{@render level(ROOT, 0)}
</ul>
<p class="text-[12px] text-ink-soft">Open a folder with its arrow to pick single files inside it. Checking a folder shows everything in it.</p>
{#if mode === 'some' && gone}
	<p class="text-[12px] text-ink-soft">{gone} chosen {gone === 1 ? 'item is' : 'items are'} no longer in the folder and will be dropped on save.</p>
{/if}

{#if mode === 'some'}
	{#each kept as path (path)}<input type="hidden" name="files" value={path} />{/each}
{/if}
