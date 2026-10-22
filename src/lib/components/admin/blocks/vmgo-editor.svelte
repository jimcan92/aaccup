<script lang="ts">
	import type { VmgoContent } from '$lib/landing';
	import { area, hint, label } from './ui';

	let { value = $bindable() }: { value: VmgoContent } = $props();

	// Goals and objectives are edited one per line.
	// svelte-ignore state_referenced_locally
	let goals = $state((value.goals ?? []).join('\n'));
	// svelte-ignore state_referenced_locally
	let objectives = $state((value.objectives ?? []).join('\n'));

	const lines = (text: string) => text.split('\n').map((line) => line.trim()).filter(Boolean);
	$effect(() => {
		value.goals = lines(goals);
		value.objectives = lines(objectives);
	});
</script>

<div class="grid gap-4">
	<div class="grid gap-4 md:grid-cols-2">
		<label class={label}>Vision<textarea bind:value={value.vision} rows="4" class={area}></textarea></label>
		<label class={label}>Mission<textarea bind:value={value.mission} rows="4" class={area}></textarea></label>
	</div>
	<div class="grid gap-4 md:grid-cols-2">
		<label class={label}>Goals<textarea bind:value={goals} rows="6" class={area} placeholder="One goal per line"></textarea></label>
		<label class={label}>Program objectives<textarea bind:value={objectives} rows="6" class={area} placeholder="One objective per line"></textarea></label>
	</div>
	<p class={hint}>One goal or objective per line; they are numbered on the page. Leave a box empty to hide it.</p>
</div>
