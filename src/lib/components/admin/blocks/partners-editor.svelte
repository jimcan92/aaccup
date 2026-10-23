<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import type { PartnersContent } from '#lib/landing.js';
	import ImageField from './image-field.svelte';
	import ItemControls from './item-controls.svelte';
	import { addButton, field, hint, move } from './ui';

	let { value = $bindable(), programId }: { value: PartnersContent; programId: string } = $props();
</script>

<div class="grid gap-3">
	{#each value.items as partner, index (index)}
		<div class="grid gap-3 border border-rule p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
			<div class="grid gap-2">
				<div class="grid gap-2 sm:grid-cols-2">
					<input bind:value={partner.name} aria-label="Partner name" placeholder="BFAR Region VII" class={field} />
					<input bind:value={partner.href} aria-label="Partner website" placeholder="Website (optional), https://…" class="{field} font-mono text-[12px]" />
				</div>
				<ImageField bind:value={partner.logo} {programId} label="Logo" contain />
			</div>
			<ItemControls {index} count={value.items.length} noun="partner" onmove={(delta) => (value.items = move(value.items, index, delta))} onremove={() => (value.items = value.items.filter((_, i) => i !== index))} />
		</div>
	{/each}
	<button type="button" onclick={() => (value.items = [...value.items, { name: '', logo: '', href: '' }])} class={addButton}><Plus class="size-4" /> Add partner</button>
	<p class={hint}>Logos with a transparent background look best. Without a logo, the name is shown.</p>
</div>
