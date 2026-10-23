<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import type { PeopleContent } from '#lib/landing.js';
	import ImageField from './image-field.svelte';
	import ItemControls from './item-controls.svelte';
	import { addButton, field, hint, move } from './ui';

	let { value = $bindable(), programId }: { value: PeopleContent; programId: string } = $props();
</script>

<div class="grid gap-3">
	{#each value.items as person, index (index)}
		<div class="grid gap-3 border border-rule p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
			<div class="grid gap-2">
				<div class="grid gap-2 sm:grid-cols-2">
					<input bind:value={person.name} aria-label="Name" placeholder="Dr. Firstname Lastname" class={field} />
					<input bind:value={person.role} aria-label="Position" placeholder="Program Chair" class={field} />
				</div>
				<input bind:value={person.credentials} aria-label="Degree or credentials" placeholder="Degree or credentials (optional)" class={field} />
				<ImageField bind:value={person.photo} {programId} />
			</div>
			<ItemControls {index} count={value.items.length} noun="person" onmove={(delta) => (value.items = move(value.items, index, delta))} onremove={() => (value.items = value.items.filter((_, i) => i !== index))} />
		</div>
	{/each}
	<button type="button" onclick={() => (value.items = [...value.items, { name: '', role: '', credentials: '', photo: '' }])} class={addButton}><Plus class="size-4" /> Add person</button>
	<p class={hint}>Portrait photos work best. Without a photo, the person's initials are shown.</p>
</div>
