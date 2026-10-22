<script lang="ts">
	import { imageSrc } from '$lib/image-url';
	import type { OrgContent, OrgItem } from '$lib/landing';
	import Initials from './initials.svelte';
	import Section from './section.svelte';

	let { content, tone }: { content: OrgContent; tone: 'paper' | 'salt' } = $props();

	// Rows from the top: level 1, then 2, then 3; empty levels are skipped.
	const rows = $derived(
		[1, 2, 3].map((level) => content.items.filter((item) => (item.level ?? 2) === level)).filter((row) => row.length)
	);
</script>

{#snippet card(person: OrgItem, top: boolean)}
	<li class="flex w-[calc(50%-0.375rem)] flex-col items-center border bg-paper p-3 text-center sm:w-48 sm:p-4 {top ? 'border-program border-t-4' : 'border-rule'}">
		{#if person.photo}
			<img src={imageSrc(person.photo, 300)} alt={person.name} loading="lazy" class="size-16 bg-rule object-cover {top ? 'sm:size-20' : ''}" />
		{:else}
			<Initials name={person.name} class="size-16 text-[20px] {top ? 'sm:size-20 sm:text-[24px]' : ''}" />
		{/if}
		<p class="mt-3 text-balance font-display text-[15px] font-semibold leading-snug tracking-[-0.02em] text-ink">{person.name}</p>
		<p class="mt-1 text-[13px] font-medium leading-snug text-program">{person.role}</p>
		{#if person.unit}<p class="mt-0.5 text-[12px] leading-snug text-ink-soft">{person.unit}</p>{/if}
	</li>
{/snippet}

<Section title={content.title} {tone}>
	<div class="flex flex-col items-center">
		{#each rows as row, index (index)}
			{#if index > 0}<span class="h-8 w-px bg-program/40" aria-hidden="true"></span>{/if}
			<!-- The top border joins the boxes of a row, like the bar of an org chart. -->
			<ul class="flex w-full flex-wrap justify-center gap-3 {index > 0 && row.length > 1 ? 'border-t border-program/40 pt-6' : ''}">
				{#each row as person, i (i)}{@render card(person, index === 0)}{/each}
			</ul>
		{/each}
	</div>
</Section>
