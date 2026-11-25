<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import type { OrgContent } from '#lib/landing.js';
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

	const newId = () => Math.random().toString(36).slice(2, 10);

	// Every person needs an id so others can report to them.
	for (const person of value.items) person.id ||= newId();

	// With reporting lines the chart is a tree, and the rows are not used.
	const isTree = $derived(value.items.some((person) => person.parent));

	/** The ids under `id`, at every depth; they cannot become its boss. */
	function below(id: string): Set<string> {
		const out = new Set<string>();
		const walk = (at: string) => {
			for (const person of value.items) {
				if (person.parent === at && person.id && !out.has(person.id)) {
					out.add(person.id);
					walk(person.id);
				}
			}
		};
		walk(id);
		return out;
	}

	function remove(index: number) {
		const gone = value.items[index];
		// The people under a removed box move up to its boss.
		value.items = value.items
			.filter((_, i) => i !== index)
			.map((person) => (gone.id && person.parent === gone.id ? { ...person, parent: gone.parent ?? '' } : person));
	}
</script>

<div class="grid gap-3">
	{#each value.items as person, index (person.id ?? index)}
		{@const blocked = person.id ? below(person.id) : new Set<string>()}
		<div class="grid gap-3 border border-rule p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
			<div class="grid gap-2">
				<div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_9rem]">
					<input bind:value={person.name} aria-label="Name" placeholder="Dr. Firstname Lastname" class={field} />
					<input bind:value={person.role} aria-label="Position" placeholder="Director of Instruction" class={field} />
					<select bind:value={person.level} aria-label="Row" class={field} disabled={isTree} title={isTree ? 'Not used while people report to someone' : undefined}>
						{#each levels as level (level.value)}<option value={level.value}>{level.label}</option>{/each}
					</select>
				</div>
				<div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
					<input bind:value={person.unit} aria-label="Office or unit" placeholder="Office or unit (optional)" class={field} />
					<select bind:value={person.parent} aria-label="Reports to" class={field}>
						<option value="">Reports to: nobody (top of the chart)</option>
						{#each value.items as boss (boss.id)}
							{#if boss.id && boss.id !== person.id && !blocked.has(boss.id)}
								<option value={boss.id}>Reports to: {boss.name || 'Unnamed'}{boss.role ? ` — ${boss.role}` : ''}</option>
							{/if}
						{/each}
					</select>
				</div>
				<!-- A new photo drops the old small copy used on the chart map. -->
				<ImageField
					bind:value={
						() => person.photo,
						(photo) => {
							if (photo !== person.photo) person.thumb = '';
							person.photo = photo;
						}
					}
					{programId}
				/>
			</div>
			<ItemControls {index} count={value.items.length} noun="person" onmove={(delta) => (value.items = move(value.items, index, delta))} onremove={() => remove(index)} />
		</div>
	{/each}
	<button type="button" onclick={() => (value.items = [...value.items, { id: newId(), parent: '', name: '', role: '', unit: '', photo: '', level: 2 }])} class={addButton}><Plus class="size-4" /> Add person</button>
	<p class={hint}>
		Set who each person reports to and the chart opens one office at a time, starting from the top; visitors click an office to see the people under it, with a small map of the whole chart beside it. Without reporting lines, people are shown in rows instead: for example the University President on the top row, the Campus Director on the second. People under the same office show in this order.
	</p>
</div>
