<script lang="ts">
	import Plus from '@lucide/svelte/icons/plus';
	import X from '@lucide/svelte/icons/x';
	import type { CtaContent } from '$lib/landing';
	import { addButton, area, field, hint, label, small } from './ui';

	let { value = $bindable() }: { value: CtaContent } = $props();
</script>

<div class="grid gap-4">
	<label class={label}>Text (optional)<textarea bind:value={value.body} rows="2" class={area}></textarea></label>
	<div class="grid gap-2">
		<span class="text-[13px] font-medium">Buttons</span>
		{#each value.buttons as button, index (index)}
			<div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[14rem_minmax(0,1fr)_auto]">
				<input bind:value={button.label} aria-label="Button label" placeholder={index === 0 ? 'Main button' : 'Second button'} class={field} />
				<input bind:value={button.href} aria-label="Button link" placeholder="https://… or /bsfi/dossier" class="{field} col-span-2 font-mono text-[12px] sm:col-span-1" />
				<button type="button" onclick={() => (value.buttons = value.buttons.filter((_, i) => i !== index))} class="{small} row-start-1 col-start-2 sm:row-start-auto sm:col-start-auto" aria-label="Remove button"><X class="size-4" /></button>
			</div>
		{/each}
		{#if value.buttons.length < 2}
			<button type="button" onclick={() => (value.buttons = [...value.buttons, { label: '', href: '' }])} class={addButton}><Plus class="size-4" /> Add button</button>
		{/if}
		<p class={hint}>Up to two buttons; the first stands out. A button shows only when it has a link.</p>
	</div>
</div>
