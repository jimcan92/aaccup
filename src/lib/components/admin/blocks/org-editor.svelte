<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import type { OrgContent } from '$lib/landing';
	import ImageField from './image-field.svelte';
	import ItemControls from './item-controls.svelte';
	import { addButton, field, hint, move } from './ui';

	let { value = $bindable(), programId }: { value: OrgContent; programId: string } = $props();

	const levels = [
		{ value: 1, label: 'Top row' },
		{ value: 2, label: 'Second row' },
		{ value: 3, label: 'Third row' },
		{ value: 4, label: 'Fourth row' }
	];
</script>

<div class="grid gap-3">
	{#each value.items as person, index (index)}
		<div class="grid gap-3 border border-rule p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
			<div class="grid gap-2">
				<div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_9rem]">
					<input bind:value={person.name} aria-label="Name" placeholder="Dr. Firstname Lastname" class={field} />
					<input bind:value={person.role} aria-label="Position" placeholder="Director of Instruction" class={field} />
					<select bind:value={person.level} aria-label="Row" class={field}>
						{#each levels as level (level.value)}<option value={level.value}>{level.label}</option>{/each}
					</select>
				</div>
				<input bind:value={person.unit} aria-label="Office or unit" placeholder="Office or unit (optional)" class={field} />
				<ImageField bind:value={person.photo} {programId} />
			</div>
			<ItemControls {index} count={value.items.length} noun="person" onmove={(delta) => (value.items = move(value.items, index, delta))} onremove={() => (value.items = value.items.filter((_, i) => i !== index))} />
		</div>
	{/each}
	<button type="button" onclick={() => (value.items = [...value.items, { name: '', role: '', unit: '', photo: '', level: 2 }])} class={addButton}><Plus class="size-4" /> Add person</button>
	<p class={hint}>For example: the University President on the top row, the Campus Director on the second, the directors on the third, and the offices on the fourth. Within a row, people show in this order.</p>
</div>
