<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import X from '@lucide/svelte/icons/x';
	import { videoEmbed, type ProjectsContent } from '#lib/landing.js';
	import ImageField from './image-field.svelte';
	import ItemControls from './item-controls.svelte';
	import { addButton, area, field, hint, label, move, small } from './ui';

	let { value = $bindable(), programId }: { value: ProjectsContent; programId: string } = $props();

	// Older drafts may lack the extra photo lists.
	// svelte-ignore state_referenced_locally
	for (const item of value.items) item.photos ??= [];
</script>

<div class="grid gap-4">
	<label class={label}>
		Intro (optional)
		<textarea bind:value={value.intro} rows="3" class={area}></textarea>
	</label>

	<div class="grid gap-1.5">
		<span class="text-[13px] font-medium">Video presentation</span>
		<input bind:value={value.video} aria-label="Video link" placeholder="YouTube or Google Drive video link" class="{field} font-mono text-[12px]" />
		{#if value.video && !videoEmbed(value.video)}
			<p class="text-[12px] text-destructive">Use a YouTube link or a Google Drive video link.</p>
		{/if}
		<input bind:value={value.videoCaption} aria-label="Video caption" placeholder="Caption under the video (optional)" class={field} />
		<p class={hint}>A Drive video must be shared as “Anyone with the link”.</p>
	</div>

	<div class="grid gap-2">
		<span class="text-[13px] font-medium">Figures (up to four)</span>
		{#each value.stats as stat, index (index)}
			<div class="grid grid-cols-[7rem_minmax(0,1fr)_auto] items-center gap-2">
				<input bind:value={stat.value} aria-label="Number" placeholder="400+" class="{field} font-display text-[16px] font-semibold" />
				<input bind:value={stat.label} aria-label="Label" placeholder="Beneficiaries" class={field} />
				<button type="button" onclick={() => (value.stats = value.stats.filter((_, i) => i !== index))} class={small} aria-label="Remove figure"><X class="size-4" /></button>
			</div>
		{/each}
		{#if value.stats.length < 4}
			<button type="button" onclick={() => (value.stats = [...value.stats, { value: '', label: '' }])} class={addButton}><Plus class="size-4" /> Add figure</button>
		{/if}
	</div>

	<div class="grid gap-2">
		<span class="text-[13px] font-medium">Projects</span>
		{#each value.items as item, index (index)}
			<div class="grid gap-3 border border-rule p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
				<div class="grid gap-2">
					<input bind:value={item.title} aria-label="Project title" placeholder="Project title" class="{field} font-medium" />
					<div class="grid gap-2 sm:grid-cols-3">
						<input bind:value={item.partner} aria-label="Partner" placeholder="Partner, e.g. Barangay Poblacion" class={field} />
						<input bind:value={item.date} aria-label="When" placeholder="When, e.g. June 2025" class={field} />
						<input bind:value={item.beneficiaries} aria-label="Beneficiaries" placeholder="e.g. 120 farmers" class={field} />
					</div>
					<textarea bind:value={item.body} aria-label="What was done" rows="3" class={area} placeholder="What was done and for whom. The card shows the first lines; the rest shows when it opens."></textarea>
					<ImageField bind:value={item.photo} {programId} label="Main photo" />
					{#each item.photos ?? [] as _, p (p)}
						<div class="flex items-center gap-2">
							<div class="min-w-0 flex-1"><ImageField bind:value={item.photos![p]} {programId} label={`Photo ${p + 2}`} /></div>
							<button type="button" onclick={() => (item.photos = item.photos!.filter((_, i) => i !== p))} class={small} aria-label="Remove photo"><X class="size-4" /></button>
						</div>
					{/each}
					{#if (item.photos?.length ?? 0) < 12}
						<button type="button" onclick={() => (item.photos = [...(item.photos ?? []), ''])} class={addButton}><Plus class="size-4" /> Add another photo</button>
					{/if}
					<input bind:value={item.video} aria-label="Project video" placeholder="Project video (optional): YouTube or Google Drive link, plays when the card opens" class="{field} font-mono text-[12px]" />
					{#if item.video && !videoEmbed(item.video)}
						<p class="text-[12px] text-destructive">Use a YouTube link or a Google Drive video link.</p>
					{/if}
					<input bind:value={item.href} aria-label="Documents link" placeholder="Documents link (optional): Drive folder or /bsie/visit/extension" class="{field} font-mono text-[12px]" />
				</div>
				<ItemControls {index} count={value.items.length} noun="project" onmove={(delta) => (value.items = move(value.items, index, delta))} onremove={() => (value.items = value.items.filter((_, i) => i !== index))} />
			</div>
		{/each}
		{#if value.items.length < 24}
			<button type="button" onclick={() => (value.items = [...value.items, { title: '', partner: '', date: '', beneficiaries: '', body: '', photo: '', photos: [], video: '', href: '' }])} class={addButton}><Plus class="size-4" /> Add project</button>
		{/if}
		<p class={hint}>Projects show in this order. Extra photos show when a visitor opens the project.</p>
	</div>
</div>
