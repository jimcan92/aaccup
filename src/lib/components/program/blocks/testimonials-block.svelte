<script lang="ts">
	import { imageSrc } from '#lib/image-url.js';
	import type { TestimonialsContent } from '#lib/landing.js';
	import Initials from './initials.svelte';
	import Section from './section.svelte';

	let { content, tone }: { content: TestimonialsContent; tone: 'paper' | 'salt' } = $props();
</script>

<Section title={content.title} {tone}>
	<ul class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each content.items as item, index (index)}
			<li>
				<figure class="flex h-full flex-col border border-rule bg-paper p-6">
					<span class="font-display text-[56px] leading-[0.6] text-program" aria-hidden="true">“</span>
					<blockquote class="mt-3 flex-1 text-pretty text-[16px] leading-relaxed text-ink">{item.quote}</blockquote>
					<figcaption class="mt-6 flex items-center gap-3 border-t border-rule pt-4">
						{#if item.photo}
							<img src={imageSrc(item.photo, 200)} alt="" loading="lazy" class="size-11 shrink-0 bg-rule object-cover" />
						{:else}
							<Initials name={item.name} class="size-11 shrink-0 text-[15px]" />
						{/if}
						<span class="min-w-0">
							<span class="block text-[14px] font-semibold text-ink">{item.name}</span>
							{#if item.role}<span class="block text-[13px] leading-snug text-ink-soft">{item.role}</span>{/if}
						</span>
					</figcaption>
				</figure>
			</li>
		{/each}
	</ul>
</Section>
