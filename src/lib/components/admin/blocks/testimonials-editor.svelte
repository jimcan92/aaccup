<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import type { TestimonialsContent } from '#lib/landing.js';
	import ImageField from './image-field.svelte';
	import ItemControls from './item-controls.svelte';
	import { addButton, area, field, move } from './ui';

	let { value = $bindable(), programId }: { value: TestimonialsContent; programId: string } = $props();
</script>

<div class="grid gap-3">
	{#each value.items as item, index (index)}
		<div class="grid gap-3 border border-rule p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
			<div class="grid gap-2">
				<textarea bind:value={item.quote} aria-label="Quote" rows="3" class={area} placeholder="What they said"></textarea>
				<div class="grid gap-2 sm:grid-cols-2">
					<input bind:value={item.name} aria-label="Name" placeholder="Name" class={field} />
					<input bind:value={item.role} aria-label="Role" placeholder="BSFi 2020 · Fisheries technologist, BFAR" class={field} />
				</div>
				<ImageField bind:value={item.photo} {programId} />
			</div>
			<ItemControls {index} count={value.items.length} noun="testimonial" onmove={(delta) => (value.items = move(value.items, index, delta))} onremove={() => (value.items = value.items.filter((_, i) => i !== index))} />
		</div>
	{/each}
	<button type="button" onclick={() => (value.items = [...value.items, { quote: '', name: '', role: '', photo: '' }])} class={addButton}><Plus class="size-4" /> Add testimonial</button>
</div>
