<script lang="ts">
	import type { StatementSize, VmgoContent } from '#lib/landing.js';
	import { area, hint, label } from './ui';

	let { value = $bindable() }: { value: VmgoContent } = $props();

	// Goals and objectives are edited one per line.
	// svelte-ignore state_referenced_locally
	let goals = $state((value.goals ?? []).join('\n'));
	// svelte-ignore state_referenced_locally
	let objectives = $state((value.objectives ?? []).join('\n'));

	const sizes: { value: StatementSize; label: string }[] = [
		{ value: 'md', label: 'Normal' },
		{ value: 'lg', label: 'Large' },
		{ value: 'xl', label: 'Extra large' }
	];

	// Older drafts have no sizes yet.
	// svelte-ignore state_referenced_locally
	value.visionSize ??= 'md';
	// svelte-ignore state_referenced_locally
	value.missionSize ??= 'md';

	const lines = (text: string) => text.split('\n').map((line) => line.trim()).filter(Boolean);
	$effect(() => {
		value.goals = lines(goals);
		value.objectives = lines(objectives);
	});
</script>

{#snippet sizePicker(name: string, key: 'visionSize' | 'missionSize')}
	<fieldset class="flex flex-wrap items-center gap-2">
		<legend class="sr-only">{name} text size</legend>
		<span class="text-[12px] text-ink-soft">Text size</span>
		{#each sizes as option (option.value)}
			<label class="flex cursor-pointer items-center gap-2 border px-2.5 py-1.5 text-[12px] {value[key] === option.value ? 'border-ink bg-salt' : 'border-rule'}">
				<input type="radio" bind:group={value[key]} value={option.value} class="size-3.5" /> {option.label}
			</label>
		{/each}
	</fieldset>
{/snippet}

<div class="grid gap-4">
	<div class="grid gap-4 md:grid-cols-2">
		<div class="grid content-start gap-2">
			<label class={label}>Vision<textarea bind:value={value.vision} rows="4" class={area}></textarea></label>
			{@render sizePicker('Vision', 'visionSize')}
		</div>
		<div class="grid content-start gap-2">
			<label class={label}>Mission<textarea bind:value={value.mission} rows="4" class={area}></textarea></label>
			{@render sizePicker('Mission', 'missionSize')}
		</div>
	</div>
	<div class="grid gap-4 md:grid-cols-2">
		<label class={label}>Goals<textarea bind:value={goals} rows="6" class={area} placeholder="One goal per line"></textarea></label>
		<label class={label}>Program objectives<textarea bind:value={objectives} rows="6" class={area} placeholder="One objective per line"></textarea></label>
	</div>
	<p class={hint}>One goal or objective per line; they are numbered on the page. Leave a box empty to hide it.</p>
</div>
