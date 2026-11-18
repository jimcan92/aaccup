<script lang="ts">
	import RichTextarea from '#lib/components/admin/blocks/rich-textarea.svelte';
	import Plus from '@lucide/svelte/icons/plus';
	import { showcaseIcons, type ShowcaseContent, type ShowcaseIcon } from '#lib/landing.js';
	import ShowcaseIconView from '#lib/components/program/blocks/showcase-icon.svelte';
	import ImageField from './image-field.svelte';
	import ItemControls from './item-controls.svelte';
	import { addButton, field, hint, label, move } from './ui';

	let { value = $bindable(), programId }: { value: ShowcaseContent; programId: string } = $props();

	// Older drafts may lack these.
	// svelte-ignore state_referenced_locally
	if (!value.button) value.button = { label: '', href: '' };
	// svelte-ignore state_referenced_locally
	if (!value.side) value.side = 'left';

	const iconLabels: Record<ShowcaseIcon, string> = {
		box: 'Inventory',
		qr: 'QR code',
		clipboard: 'Checklist',
		wrench: 'Maintenance',
		alert: 'Incident',
		chart: 'Reports',
		users: 'People',
		shield: 'Security'
	};
</script>

<div class="grid gap-4">
	<div class="grid gap-3 sm:grid-cols-2">
		<label class={label}>
			Small label above the heading (optional)
			<input bind:value={value.eyebrow} placeholder="Built by BSIE" class={field} />
		</label>
		<label class={label}>
			Address shown in the browser frame (optional)
			<input bind:value={value.url} placeholder="lab.ctu-moalboal.online" class="{field} font-mono text-[12px]" />
		</label>
	</div>
	<div class={label}><span>Text</span><RichTextarea bind:value={value.body} rows={4} ariaLabel="Text" /></div>

	<div class="grid gap-2">
		<span class="text-[13px] font-medium">Features</span>
		{#each value.features as feature, index (index)}
			<div class="grid gap-3 border border-rule p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
				<div class="grid gap-2">
					<div class="grid gap-2 sm:grid-cols-[11rem_minmax(0,1fr)]">
						<label class="flex h-10 items-center gap-2 border border-rule bg-salt px-2">
							<span class="text-program"><ShowcaseIconView name={feature.icon} class="size-4" /></span>
							<select bind:value={feature.icon} aria-label="Icon" class="h-full min-w-0 flex-1 bg-transparent text-[13px] outline-none">
								{#each showcaseIcons as icon (icon)}<option value={icon}>{iconLabels[icon]}</option>{/each}
							</select>
						</label>
						<input bind:value={feature.title} aria-label="Feature" placeholder="Equipment inventory" class="{field} font-medium" />
					</div>
					<input bind:value={feature.text} aria-label="Short description" placeholder="One line about it (optional)" class={field} />
				</div>
				<ItemControls {index} count={value.features.length} noun="feature" onmove={(delta) => (value.features = move(value.features, index, delta))} onremove={() => (value.features = value.features.filter((_, i) => i !== index))} />
			</div>
		{/each}
		{#if value.features.length < 8}
			<button type="button" onclick={() => (value.features = [...value.features, { icon: 'box', title: '', text: '' }])} class={addButton}><Plus class="size-4" /> Add feature</button>
		{/if}
	</div>

	<div class="grid gap-2">
		<span class="text-[13px] font-medium">Screenshots</span>
		{#each value.shots as shot, index (index)}
			<div class="grid gap-3 border border-rule p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
				<div class="grid gap-2">
					<ImageField bind:value={shot.src} {programId} label="Screenshot" />
					<input bind:value={shot.caption} aria-label="Caption" placeholder="Caption, e.g. Dashboard" class={field} />
				</div>
				<ItemControls {index} count={value.shots.length} noun="screenshot" onmove={(delta) => (value.shots = move(value.shots, index, delta))} onremove={() => (value.shots = value.shots.filter((_, i) => i !== index))} />
			</div>
		{/each}
		{#if value.shots.length < 12}
			<button type="button" onclick={() => (value.shots = [...value.shots, { src: '', caption: '' }])} class={addButton}><Plus class="size-4" /> Add screenshot</button>
		{/if}
		<p class={hint}>Screenshots of the whole screen, all the same size, look best: the frame takes their shape. Uploads up to 5 MB.</p>
	</div>

	<fieldset class="grid gap-1.5">
		<legend class="mb-1.5 text-[13px] font-medium">Text side on wide screens</legend>
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
				<input bind:value={value.button.label} aria-label="Button label" placeholder="Open the system" class={field} />
				<input bind:value={value.button.href} aria-label="Button link" placeholder="https://lab.ctu-moalboal.online" class="{field} font-mono text-[12px]" />
			</div>
			<p class={hint}>The button shows only when it has both a label and a link.</p>
		</div>
	{/if}
</div>
