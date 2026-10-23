<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import type { FaqContent } from '#lib/landing.js';
	import ItemControls from './item-controls.svelte';
	import { addButton, area, field, move } from './ui';

	let { value = $bindable() }: { value: FaqContent } = $props();
</script>

<div class="grid gap-3">
	{#each value.items as item, index (index)}
		<div class="grid gap-3 border border-rule p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
			<div class="grid gap-2">
				<input bind:value={item.question} aria-label="Question" placeholder="Question" class="{field} font-medium" />
				<textarea bind:value={item.answer} aria-label="Answer" rows="3" class={area} placeholder="Answer. Leave an empty line between paragraphs."></textarea>
			</div>
			<ItemControls {index} count={value.items.length} noun="question" onmove={(delta) => (value.items = move(value.items, index, delta))} onremove={() => (value.items = value.items.filter((_, i) => i !== index))} />
		</div>
	{/each}
	<button type="button" onclick={() => (value.items = [...value.items, { question: '', answer: '' }])} class={addButton}><Plus class="size-4" /> Add question</button>
</div>
