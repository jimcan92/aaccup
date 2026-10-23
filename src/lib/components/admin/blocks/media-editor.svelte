<script lang="ts">
	import type { MediaContent } from '#lib/landing.js';
	import ImageField from './image-field.svelte';
	import { area, field, hint, label } from './ui';

	let { value = $bindable(), programId }: { value: MediaContent; programId: string } = $props();

	// Older drafts may not have a button yet.
	// svelte-ignore state_referenced_locally
	if (!value.button) value.button = { label: '', href: '' };
</script>

<div class="grid gap-4">
	<label class={label}>Text<textarea bind:value={value.body} rows="5" class={area} placeholder="Leave an empty line between paragraphs."></textarea></label>
	<div class="grid gap-1.5">
		<span class="text-[13px] font-medium">Photo</span>
		<ImageField bind:value={value.src} {programId} />
		<input bind:value={value.alt} aria-label="Description for screen readers" placeholder="What the photo shows (for screen readers)" class={field} />
	</div>
	<fieldset class="grid gap-1.5">
		<legend class="mb-1.5 text-[13px] font-medium">Photo side on wide screens</legend>
		<div class="flex gap-2">
			{#each [{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }] as option (option.value)}
				<label class="flex cursor-pointer items-center gap-2 border px-3 py-2 text-[13px] {value.side === option.value ? 'border-ink bg-salt' : 'border-rule'}">
					<input type="radio" bind:group={value.side} value={option.value} class="size-4" /> {option.label}
				</label>
			{/each}
		</div>
	</fieldset>
	{#if value.button}
		<div class="grid gap-1.5">
			<span class="text-[13px] font-medium">Button (optional)</span>
			<div class="grid gap-2 sm:grid-cols-[14rem_minmax(0,1fr)]">
				<input bind:value={value.button.label} aria-label="Button label" placeholder="Learn more" class={field} />
				<input bind:value={value.button.href} aria-label="Button link" placeholder="https://… or /bsfi/dossier" class="{field} font-mono text-[12px]" />
			</div>
			<p class={hint}>The button shows only when it has both a label and a link.</p>
		</div>
	{/if}
</div>
