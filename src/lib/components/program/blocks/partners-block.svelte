<script lang="ts">
	import { imageSrc } from '#lib/image-url.js';
	import type { PartnersContent } from '#lib/landing.js';
	import Section from './section.svelte';

	let { content, tone }: { content: PartnersContent; tone: 'paper' | 'salt' } = $props();
</script>

<Section title={content.title} {tone}>
	<ul class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
		{#each content.items as partner, index (index)}
			<li>
				<svelte:element
					this={partner.href ? 'a' : 'div'}
					href={partner.href || undefined}
					target={partner.href ? '_blank' : undefined}
					rel={partner.href ? 'noopener noreferrer' : undefined}
					class="group flex h-full flex-col items-center justify-center gap-3 border border-rule bg-paper p-5 text-center transition-colors {partner.href ? 'hover:border-program/50' : ''}"
				>
					{#if partner.logo}
						<img src={imageSrc(partner.logo, 400)} alt="" loading="lazy" class="h-14 w-auto max-w-full object-contain grayscale transition duration-300 group-hover:grayscale-0" />
					{/if}
					<span class="text-[13px] font-medium leading-snug {partner.logo ? 'text-ink-soft' : 'font-display text-[16px] font-semibold text-ink'}">{partner.name}</span>
				</svelte:element>
			</li>
		{/each}
	</ul>
</Section>
