<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import X from '@lucide/svelte/icons/x';
	import type { PartnersContent } from '#lib/landing.js';
	import ImageField from './image-field.svelte';
	import ItemControls from './item-controls.svelte';
	import { addButton, area, field, hint, label, move, small } from './ui';

	let { value = $bindable(), programId }: { value: PartnersContent; programId: string } = $props();

	// Older drafts have no intro or figures.
	// svelte-ignore state_referenced_locally
	value.stats ??= [];
	// svelte-ignore state_referenced_locally
	value.intro ??= '';

	const listId = $props.id();
	// Groups already used, offered as suggestions so partners line up under the same heading.
	const groups = $derived([...new Set(value.items.map((item) => item.group?.trim()).filter(Boolean))]);
</script>

<div class="grid gap-4">
	<label class={label}>
		Intro (optional)
		<textarea bind:value={value.intro} rows="3" class={area} placeholder="One or two lines on what the partnerships do for students, e.g. OJT placements under CMO No. 104, s. 2017."></textarea>
	</label>

	<div class="grid gap-2">
		<span class="text-[13px] font-medium">Figures (up to four)</span>
		{#each value.stats ?? [] as stat, index (index)}
			<div class="grid grid-cols-[7rem_minmax(0,1fr)_auto] items-center gap-2">
				<input bind:value={stat.value} aria-label="Number" placeholder="20" class="{field} font-display text-[16px] font-semibold" />
				<input bind:value={stat.label} aria-label="Label" placeholder="OJT host companies" class={field} />
				<button type="button" onclick={() => (value.stats = (value.stats ?? []).filter((_, i) => i !== index))} class={small} aria-label="Remove figure"><X class="size-4" /></button>
			</div>
		{/each}
		{#if (value.stats ?? []).length < 4}
			<button type="button" onclick={() => (value.stats = [...(value.stats ?? []), { value: '', label: '' }])} class={addButton}><Plus class="size-4" /> Add figure</button>
		{/if}
	</div>

	<div class="grid gap-2">
		<span class="text-[13px] font-medium">Partners</span>
		<datalist id="{listId}-groups">
			{#each groups as group (group)}<option value={group}></option>{/each}
		</datalist>
		{#each value.items as partner, index (index)}
			<div class="grid gap-3 border border-rule p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
				<div class="grid gap-2">
					<div class="grid gap-2 sm:grid-cols-2">
						<input bind:value={partner.name} aria-label="Partner name" placeholder="Pepsi-Cola Products Philippines, Inc." class="{field} font-medium" />
						<input bind:value={partner.group} list="{listId}-groups" aria-label="Group" placeholder="Group (optional), e.g. Industry · Food manufacturing" class={field} />
					</div>
					<div class="grid gap-2 sm:grid-cols-3">
						<input bind:value={partner.sector} aria-label="What they do" placeholder="What they do, e.g. Beverage manufacturing" class={field} />
						<input bind:value={partner.place} aria-label="Location" placeholder="Location, e.g. Minglanilla, Cebu" class={field} />
						<input bind:value={partner.note} aria-label="Note" placeholder="Note, e.g. 13 BSIE trainees · 2025" class={field} />
					</div>
					<input bind:value={partner.href} aria-label="Partner website" placeholder="Website (optional), https://…" class="{field} font-mono text-[12px]" />
					<ImageField bind:value={partner.logo} {programId} label="Logo" contain />
				</div>
				<ItemControls {index} count={value.items.length} noun="partner" onmove={(delta) => (value.items = move(value.items, index, delta))} onremove={() => (value.items = value.items.filter((_, i) => i !== index))} />
			</div>
		{/each}
		<button type="button" onclick={() => (value.items = [...value.items, { name: '', logo: '', href: '', group: '', sector: '', place: '', note: '' }])} class={addButton}><Plus class="size-4" /> Add partner</button>
		<p class={hint}>
			Partners with the same group are listed under one heading. With a sector, location or note a partner shows as a card; with only a name or logo it stays a small tile. Logos with a transparent background look best.
		</p>
	</div>
</div>
