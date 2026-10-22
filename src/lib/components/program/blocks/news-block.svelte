<script lang="ts">
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import { paragraphs } from '$lib/image-url';
	import { formatDate, type NewsContent } from '$lib/landing';
	import Section from './section.svelte';

	let { content, tone }: { content: NewsContent; tone: 'paper' | 'salt' } = $props();

	const external = (href: string) => /^https?:/.test(href);
</script>

<Section title={content.title} {tone}>
	<ul class="max-w-4xl border-t border-rule">
		{#each content.items as item, index (index)}
			<li class="grid gap-1 border-b border-rule py-5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6">
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
							{#each paragraphs(item.body) as paragraph, p (p)}<p>{paragraph}</p>{/each}
						</div>
					{/if}
				</div>
			</li>
		{/each}
	</ul>
</Section>
