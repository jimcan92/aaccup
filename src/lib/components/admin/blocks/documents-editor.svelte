<script lang="ts">
	import FileText from '@lucide/svelte/icons/file-text';
	import Plus from '@lucide/svelte/icons/plus';
	import { driveThumbnail, previewUrl } from '#lib/drive-url.js';
	import type { DocumentsContent } from '#lib/landing.js';
	import ItemControls from './item-controls.svelte';
	import { addButton, area, field, hint, label, move } from './ui';

	let { value = $bindable() }: { value: DocumentsContent } = $props();
</script>

<div class="grid gap-3">
	<label class={label}>
		Intro line (optional)
		<textarea bind:value={value.intro} rows="2" class={area}></textarea>
	</label>
	{#each value.items as item, index (index)}
		{@const thumb = driveThumbnail(item.url, 200)}
		<div class="grid gap-3 border border-rule p-3 sm:grid-cols-[4.5rem_minmax(0,1fr)_auto]">
			<div class="hidden aspect-[210/297] w-[4.5rem] overflow-hidden border border-rule bg-salt sm:block">
				{#if thumb}
					<img src={thumb} alt="" referrerpolicy="no-referrer" class="h-full w-full bg-white object-cover object-top" />
				{:else}
					<span class="grid h-full place-items-center text-ink-soft"><FileText class="size-6" strokeWidth={1.25} /></span>
				{/if}
			</div>
			<div class="grid gap-2">
				<input bind:value={item.title} aria-label="Title" placeholder="Title, e.g. Certificate of Program Compliance" class="{field} font-medium" />
				<input bind:value={item.label} aria-label="Detail" placeholder="Detail (optional), e.g. BOR Resolution No. 24, s. 2018" class={field} />
				<input bind:value={item.url} aria-label="Google Drive link" placeholder="Google Drive link, https://drive.google.com/file/d/…" class="{field} font-mono text-[12px]" />
				{#if item.url && !previewUrl(item.url)}
					<p class="text-[12px] text-destructive">This isn't a Google Drive link. Paste the file's Drive link.</p>
				{:else if !item.url}
					<p class={hint}>No link yet: the card shows "In preparation".</p>
				{/if}
			</div>
			<ItemControls {index} count={value.items.length} noun="document" onmove={(delta) => (value.items = move(value.items, index, delta))} onremove={() => (value.items = value.items.filter((_, i) => i !== index))} />
		</div>
	{/each}
	{#if value.items.length < 12}
		<button type="button" onclick={() => (value.items = [...value.items, { title: '', label: '', url: '' }])} class={addButton}><Plus class="size-4" /> Add document</button>
	{/if}
	<p class={hint}>Share each file in Drive as “Anyone with the link — Viewer”, or its picture and preview stay blank. Move this block to the top to show it first.</p>
</div>
