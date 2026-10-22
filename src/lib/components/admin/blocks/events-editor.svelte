<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import type { EventsContent } from '$lib/landing';
	import ItemControls from './item-controls.svelte';
	import { addButton, area, field, hint, move } from './ui';

	let { value = $bindable() }: { value: EventsContent } = $props();

	const today = () => new Date().toISOString().slice(0, 10);
</script>

<div class="grid gap-3">
	<button type="button" onclick={() => (value.items = [{ date: today(), end: '', time: '', title: '', place: '', body: '', href: '' }, ...value.items])} class={addButton}><Plus class="size-4" /> Add event</button>
	{#each value.items as item, index (index)}
		<div class="grid gap-3 border border-rule p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
			<div class="grid gap-2">
				<input bind:value={item.title} aria-label="Event title" placeholder="Event title" class="{field} font-medium" />
				<div class="grid gap-2 sm:grid-cols-3">
					<label class="grid gap-1 text-[12px] text-ink-soft">Starts<input type="date" bind:value={item.date} class={field} /></label>
					<label class="grid gap-1 text-[12px] text-ink-soft">Ends (optional)<input type="date" bind:value={item.end} min={item.date} class={field} /></label>
					<label class="grid gap-1 text-[12px] text-ink-soft">Time (optional)<input bind:value={item.time} placeholder="8:00 AM – 5:00 PM" class={field} /></label>
				</div>
				<input bind:value={item.place} aria-label="Place" placeholder="Place (optional), e.g. Campus gym" class={field} />
				<textarea bind:value={item.body} aria-label="Details" rows="2" class={area} placeholder="Details (optional)"></textarea>
				<input bind:value={item.href} aria-label="Link" placeholder="Link for more (optional), https://…" class="{field} font-mono text-[12px]" />
			</div>
			<ItemControls {index} count={value.items.length} noun="event" onmove={(delta) => (value.items = move(value.items, index, delta))} onremove={() => (value.items = value.items.filter((_, i) => i !== index))} />
		</div>
	{/each}
	<p class={hint}>Events are sorted by date when saved. After its last day an event moves to “Past events”; the four most recent are shown.</p>
</div>
