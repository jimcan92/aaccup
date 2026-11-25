<script lang="ts">
	import Photo from '#lib/components/site/photo.svelte';
	import RichText from '#lib/components/site/rich-text.svelte';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import { formatDate, type NewsContent } from '#lib/landing.js';
	import Section from './section.svelte';

	let { content, tone }: { content: NewsContent; tone: 'paper' | 'salt' } = $props();

	const external = (href: string) => /^https?:/.test(href);
</script>

<Section title={content.title} {tone}>
	<ul class="max-w-5xl border-t border-rule">
		{#each content.items as item, index (index)}
			<li class="grid gap-1 border-b border-rule py-5 sm:gap-6 {item.photo ? 'sm:grid-cols-[9rem_minmax(0,1fr)_11rem]' : 'sm:grid-cols-[9rem_minmax(0,1fr)]'}">
				{#if item.date}<time datetime={item.date} class="pt-0.5 font-mono text-[12px] text-ink-soft">{formatDate(item.date)}</time>{:else}<span></span>{/if}
				<div>
					<h3 class="font-display text-[18px] font-semibold leading-snug tracking-[-0.02em] text-ink">
						{#if item.href}
							<a href={item.href} target={external(item.href) ? '_blank' : undefined} rel={external(item.href) ? 'noopener noreferrer' : undefined} class="inline-flex items-start gap-1 hover:text-program hover:underline hover:underline-offset-4">
								{item.title}<ArrowUpRight class="mt-1 size-4 shrink-0" />
							</a>
						{:else}
							{item.title}
						{/if}
					</h3>
					{#if item.body}
						<div class="mt-1.5 max-w-[68ch] space-y-3 text-[15px] leading-relaxed text-ink-soft">
							<RichText text={item.body} />
						</div>
					{/if}
				</div>
				{#if item.photo}
					<!-- The story's photo or news card; it opens the story too. -->
					{#if item.href}
						<a href={item.href} target={external(item.href) ? '_blank' : undefined} rel={external(item.href) ? 'noopener noreferrer' : undefined} class="mt-3 block w-full max-w-[18rem] sm:mt-0" tabindex="-1" aria-hidden="true">
							<Photo src={item.photo} alt="" width={600} class="aspect-square w-full border border-rule transition-opacity hover:opacity-90" loading="lazy" />
						</a>
					{:else}
						<Photo src={item.photo} alt={item.title} width={600} class="mt-3 aspect-square w-full max-w-[18rem] border border-rule sm:mt-0" loading="lazy" />
					{/if}
				{/if}
			</li>
		{/each}
	</ul>
</Section>
