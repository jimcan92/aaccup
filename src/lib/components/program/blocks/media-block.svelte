<script lang="ts">
	import Photo from '#lib/components/site/photo.svelte';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ImageIcon from '@lucide/svelte/icons/image';
	import { paragraphs } from '#lib/image-url.js';
	import type { MediaContent } from '#lib/landing.js';

	let { content, tone }: { content: MediaContent; tone: 'paper' | 'salt' } = $props();

	const background = { paper: 'bg-paper', salt: 'bg-salt' };
	const external = $derived(/^https?:/.test(content.button?.href ?? ''));
</script>

<section class="border-b border-rule {background[tone]}">
	<div class="mx-auto grid max-w-[1280px] items-center gap-8 px-5 py-14 sm:px-8 md:grid-cols-2 md:gap-14">
		<div class={content.side === 'right' ? 'md:order-2' : ''}>
			{#if content.src}
				<Photo src={content.src} alt={content.alt ?? ''} width={1400} class="aspect-[4/3] w-full" iconClass="size-10" />
			{:else}
				<div class="grid aspect-[4/3] w-full place-items-center bg-program/10 text-program/50" aria-hidden="true"><ImageIcon class="size-10" /></div>
			{/if}
		</div>
		<div>
			{#if content.title}
				<h2 class="text-balance font-display text-[clamp(1.6rem,3.2vw,2.6rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-ink">{content.title}</h2>
			{/if}
			<div class="mt-4 max-w-[60ch] space-y-4 text-[15px] leading-relaxed text-ink-soft sm:text-[16px]">
				{#each paragraphs(content.body) as paragraph, index (index)}<p>{paragraph}</p>{/each}
			</div>
			{#if content.button?.label && content.button.href}
				<a
					href={content.button.href}
					target={external ? '_blank' : undefined}
					rel={external ? 'noopener noreferrer' : undefined}
					class="mt-6 inline-flex h-11 items-center gap-2 bg-program px-5 text-[14px] font-semibold text-program-contrast transition-opacity hover:opacity-90"
				>
					{content.button.label}
					<ArrowRight class="size-4" />
				</a>
			{/if}
		</div>
	</div>
</section>
