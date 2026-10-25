<script lang="ts">
	import RichText from '#lib/components/site/rich-text.svelte';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import type { FaqContent } from '#lib/landing.js';
	import Section from './section.svelte';

	let { content, tone }: { content: FaqContent; tone: 'paper' | 'salt' } = $props();
</script>

<Section title={content.title} {tone} narrow>
	<div class="border-t border-rule">
		{#each content.items as item, index (index)}
			<details class="group border-b border-rule">
				<summary class="flex cursor-pointer list-none items-start justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
					<h3 class="font-display text-[17px] font-semibold leading-snug tracking-[-0.02em] text-ink group-hover:text-program sm:text-[18px]">{item.question}</h3>
					<ChevronDown class="mt-1 size-5 shrink-0 text-ink-soft transition-transform group-open:rotate-180" aria-hidden="true" />
				</summary>
				<div class="max-w-[68ch] space-y-3 pb-5 text-[15px] leading-relaxed text-ink-soft">
					<RichText text={item.answer} />
				</div>
			</details>
		{/each}
	</div>
</Section>
