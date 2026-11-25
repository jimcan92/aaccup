<script lang="ts">
	import Photo from '#lib/components/site/photo.svelte';
	import RichText from '#lib/components/site/rich-text.svelte';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import { formatDate, type NewsContent, type NewsItem } from '#lib/landing.js';
	import Section from './section.svelte';

	let { content, tone }: { content: NewsContent; tone: 'paper' | 'salt' } = $props();

	const external = (href: string) => /^https?:/.test(href);

	// Stories with a photo alternate sides: the first has its photo on the left, the next on the right.
	const side = $derived.by(() => {
		let count = 0;
		return content.items.map((item) => (item.photo ? (count++ % 2 === 0 ? 'left' : 'right') : null));
	});
</script>

{#snippet heading(item: NewsItem, large: boolean)}
	<h3 class="font-display font-semibold leading-snug tracking-[-0.02em] text-ink {large ? 'text-[clamp(1.3rem,2.2vw,1.7rem)] leading-tight' : 'text-[18px]'}">
		{#if item.href}
			<a href={item.href} target={external(item.href) ? '_blank' : undefined} rel={external(item.href) ? 'noopener noreferrer' : undefined} class="inline-flex items-start gap-1 hover:text-program hover:underline hover:underline-offset-4">
				{item.title}<ArrowUpRight class="mt-1 size-4 shrink-0" />
			</a>
		{:else}
			{item.title}
		{/if}
	</h3>
{/snippet}

<Section title={content.title} {tone}>
	<ul class="border-t border-rule">
		{#each content.items as item, index (index)}
			{#if item.photo}
				<!-- A story with a photo: the photo large on one side, date and story on the other. -->
				<li class="grid items-center gap-6 border-b border-rule py-8 md:grid-cols-2 md:gap-12 md:py-12">
					<div class={side[index] === 'right' ? 'md:order-2' : ''}>
						{#if item.href}
							<a href={item.href} target={external(item.href) ? '_blank' : undefined} rel={external(item.href) ? 'noopener noreferrer' : undefined} class="block" tabindex="-1" aria-hidden="true">
								<Photo src={item.photo} alt="" width={1200} class="aspect-square w-full border border-rule transition-opacity hover:opacity-90" loading="lazy" />
							</a>
						{:else}
							<Photo src={item.photo} alt={item.title} width={1200} class="aspect-square w-full border border-rule" loading="lazy" />
						{/if}
					</div>
					<div>
						{#if item.date}<time datetime={item.date} class="font-mono text-[12px] uppercase tracking-wide text-program">{formatDate(item.date)}</time>{/if}
						<div class="mt-2">{@render heading(item, true)}</div>
						{#if item.body}
							<div class="mt-3 max-w-[60ch] space-y-3 text-[15px] leading-relaxed text-ink-soft">
								<RichText text={item.body} />
							</div>
						{/if}
						{#if item.href}
							<a href={item.href} target={external(item.href) ? '_blank' : undefined} rel={external(item.href) ? 'noopener noreferrer' : undefined} class="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-program hover:underline hover:underline-offset-4">
								Read the full story <ArrowUpRight class="size-4" />
							</a>
						{/if}
					</div>
				</li>
			{:else}
				<li class="grid max-w-5xl gap-1 border-b border-rule py-5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6">
					{#if item.date}<time datetime={item.date} class="pt-0.5 font-mono text-[12px] text-ink-soft">{formatDate(item.date)}</time>{:else}<span></span>{/if}
					<div>
						{@render heading(item, false)}
						{#if item.body}
							<div class="mt-1.5 max-w-[68ch] space-y-3 text-[15px] leading-relaxed text-ink-soft">
								<RichText text={item.body} />
							</div>
						{/if}
					</div>
				</li>
			{/if}
		{/each}
	</ul>
</Section>
