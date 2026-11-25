<script lang="ts">
	import Photo from '#lib/components/site/photo.svelte';
	import type { OrgContent, OrgItem } from '#lib/landing.js';
	import Initials from './initials.svelte';
	import Section from './section.svelte';

	let { content, tone }: { content: OrgContent; tone: 'paper' | 'salt' } = $props();

	// Rows from the top: levels 1 to 4; empty levels are skipped.
	const rows = $derived(
		[1, 2, 3, 4].map((level) => content.items.filter((item) => (item.level ?? 2) === level)).filter((row) => row.length)
	);
</script>

{#snippet card(person: OrgItem, top: boolean)}
	<!-- The photo fills the card; name and role sit on a dark band at the bottom so they stay readable. -->
	<li class="relative aspect-[4/5] w-[calc(50%-0.375rem)] overflow-hidden border bg-paper {top ? 'border-program border-t-4 sm:w-64' : 'border-rule sm:w-52'}">
		<div class="absolute inset-0">
			{#if person.photo}
				<Photo src={person.photo} alt={person.name} width={600} class="h-full w-full" imgClass="object-top" iconClass="size-6" />
			{:else}
				<Initials name={person.name} class="h-full w-full text-[44px] {top ? 'sm:text-[56px]' : ''}" />
			{/if}
		</div>
		<div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/70 to-transparent px-2.5 pb-2.5 pt-8 text-center text-white sm:px-3 sm:pb-3">
			<p class="text-balance font-display text-[13px] font-semibold leading-tight tracking-[-0.01em] {top ? 'sm:text-[15px]' : ''}">{person.name}</p>
			<p class="mt-0.5 text-[11px] font-medium leading-snug text-white/90 {top ? 'sm:text-[12px]' : ''}">{person.role}</p>
			{#if person.unit}<p class="text-[11px] leading-snug text-white/75">{person.unit}</p>{/if}
		</div>
	</li>
{/snippet}

<Section title={content.title} {tone}>
	<div class="flex flex-col items-center">
		{#each rows as row, index (index)}
			{#if index > 0}<span class="h-8 w-px bg-program/40" aria-hidden="true"></span>{/if}
			<!-- The top border joins the boxes of a row, like the bar of an org chart. -->
			<ul class="flex w-full flex-wrap justify-center gap-3 {index > 0 && row.length > 1 ? 'border-t border-program/40 pt-6' : ''}">
				{#each row as person, i (i)}{@render card(person, index < 2 && row.length === 1)}{/each}
			</ul>
		{/each}
	</div>
</Section>
