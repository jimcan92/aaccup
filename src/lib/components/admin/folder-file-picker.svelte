<script lang="ts">
	import { enhance } from '#lib/admin-enhance.js';
	import { fileIcon, fileIconTone } from '#lib/file-icon.js';
	import { FolderListing, ROOT } from '#lib/folder-listing.svelte.js';
	import { formatDate } from '#lib/format.js';

	/**
	 * Chooses which items of a folder document's Drive folder the public site lists: every item
	 * (shown = null) or only the checked ones, e.g. the compiled PDF and not its drafts.
	 * Lists the whole folder (staff-only `all`), whatever is chosen now.
	 */
	let { documentId, shown, onsaved }: { documentId: string; shown: string[] | null; onsaved?: () => void } = $props();

	// svelte-ignore state_referenced_locally
	const folder = new FolderListing(documentId, true, true);
	// svelte-ignore state_referenced_locally
	let mode = $state<'all' | 'some'>(shown ? 'some' : 'all');
	// svelte-ignore state_referenced_locally
	let checked = $state<string[]>(shown ?? []);
	const listing = $derived(folder.listings.get(ROOT));
	// Chosen items that are no longer in the folder (moved or deleted in Drive).
	const gone = $derived(Array.isArray(listing) ? checked.filter((id) => !listing.some((entry) => entry.id === id)) : []);

	$effect(() => {
		folder.load(ROOT);
	});
</script>

<form
	method="POST"
	action="?/saveShownFiles"
	use:enhance={() => async ({ result, update }) => {
		await update({ reset: false });
		if (result.type === 'success') onsaved?.();
	}}
	class="mt-3 grid gap-3 bg-paper p-4"
>
	<input type="hidden" name="id" value={documentId} />
	<fieldset class="grid gap-1.5 text-[13px]">
		<legend class="mb-1 font-medium">What the public site lists inside this folder</legend>
		<label class="flex items-center gap-2"><input type="radio" name="mode" value="all" bind:group={mode} /> Show every file in the folder</label>
		<label class="flex items-center gap-2"><input type="radio" name="mode" value="some" bind:group={mode} /> Show only the files checked below</label>
	</fieldset>

	{#if listing === undefined || listing === 'loading'}
		<p class="text-[13px] text-ink-soft">Reading the Drive folder…</p>
	{:else if listing === 'error'}
		<p class="text-[13px] text-destructive">Could not read the Drive folder. Try again later.</p>
	{:else if listing.length === 0}
		<p class="text-[13px] text-ink-soft">The folder is empty.</p>
	{:else}
		<ul class="border-t border-rule" class:opacity-50={mode === 'all'}>
			{#each listing as entry (entry.id)}
				{@const Icon = fileIcon(entry.mimeType)}
				<li class="border-b border-rule">
					<label class="grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-2.5 py-2 text-[13px]">
						<input type="checkbox" name="files" value={entry.id} bind:group={checked} disabled={mode === 'all'} />
						<Icon class="size-4 {fileIconTone(entry.mimeType)}" />
						<span class="truncate">{entry.name}{entry.folder ? ' (folder, with everything in it)' : ''}</span>
						<span class="font-mono text-[11px] text-ink-soft">{formatDate(entry.modified)}</span>
					</label>
				</li>
			{/each}
		</ul>
		{#if mode === 'some' && gone.length}
			<p class="text-[12px] text-ink-soft">{gone.length} chosen {gone.length === 1 ? 'item is' : 'items are'} no longer in the folder and will be dropped on save.</p>
		{/if}
	{/if}

	{#if Array.isArray(listing)}
		<!-- Only checked boxes are sent, so ids that left the folder drop out on save. -->
		<button class="h-10 w-fit bg-ink px-4 text-[13px] font-medium text-paper hover:bg-ink-soft">Save</button>
	{/if}
</form>
