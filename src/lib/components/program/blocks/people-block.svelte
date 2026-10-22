<script lang="ts">
	import { imageSrc } from '$lib/image-url';
	import type { PeopleContent } from '$lib/landing';
	import Initials from './initials.svelte';
	import Section from './section.svelte';

	let { content, tone }: { content: PeopleContent; tone: 'paper' | 'salt' } = $props();
</script>

<Section title={content.title} {tone}>
	<ul class="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
		{#each content.items as person, index (index)}
			<li>
				{#if person.photo}
					<img src={imageSrc(person.photo, 800)} alt={person.name} loading="lazy" class="aspect-[4/5] w-full bg-rule object-cover" />
				{:else}
					<Initials name={person.name} class="aspect-[4/5] w-full text-[clamp(2rem,5vw,3.25rem)]" />
				{/if}
				<p class="mt-3 font-display text-[17px] font-semibold leading-snug tracking-[-0.02em] text-ink">{person.name}</p>
				{#if person.role}<p class="mt-0.5 text-[14px] font-medium text-program">{person.role}</p>{/if}
				{#if person.credentials}<p class="mt-0.5 text-[13px] leading-snug text-ink-soft">{person.credentials}</p>{/if}
			</li>
		{/each}
	</ul>
</Section>
