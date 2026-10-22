<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import type { NewsContent } from '$lib/landing';
	import ItemControls from './item-controls.svelte';
	import { addButton, area, field, hint, move } from './ui';

	let { value = $bindable() }: { value: NewsContent } = $props();

	const today = () => new Date().toISOString().slice(0, 10);
</script>

<div class="grid gap-3">
	<button type="button" onclick={() => (value.items = [{ date: today(), title: '', body: '', href: '' }, ...value.items])} class={addButton}><Plus class="size-4" /> Add announcement at the top</button>
	{#each value.items as item, index (index)}
		<div class="grid gap-3 border border-rule p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
			<div class="grid gap-2">
				<div class="grid gap-2 sm:grid-cols-[11rem_minmax(0,1fr)]">
					<input type="date" bind:value={item.date} aria-label="Date" class={field} />
					<input bind:value={item.title} aria-label="Title" placeholder="Title" class="{field} font-medium" />
				</div>
				<textarea bind:value={item.body} aria-label="Details" rows="2" class={area} placeholder="Details (optional)"></textarea>
				<input bind:value={item.href} aria-label="Link" placeholder="Link for more (optional), https://…" class="{field} font-mono text-[12px]" />
			</div>
			<ItemControls {index} count={value.items.length} noun="announcement" onmove={(delta) => (value.items = move(value.items, index, delta))} onremove={() => (value.items = value.items.filter((_, i) => i !== index))} />
		</div>
	{/each}
	<p class={hint}>Shown in this order; keep the newest at the top and remove old ones.</p>
</div>
