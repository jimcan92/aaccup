<script lang="ts">
	import { paragraphs } from '$lib/image-url';
	import type { TimelineItem } from '$lib/landing';

	let { items, title }: { items: TimelineItem[]; title?: string } = $props();

	const id = $props.id();
</script>

<!-- Milestones down a line: the year sits left of the line on wide screens and above the title on phones. -->
<section class="border-b border-rule bg-paper" aria-labelledby={title ? `${id}-heading` : undefined}>
	<div class="mx-auto max-w-[1280px] px-5 py-14 sm:px-8">
		{#if title}
			<h2 id={`${id}-heading`} class="text-balance font-display text-[clamp(1.6rem,3.2vw,2.6rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-ink">{title}</h2>
		{/if}

		<ol class="mt-10 max-w-4xl">
			{#each items as item, index (index)}
				<li class="grid sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-8">
					<p class="hidden pt-0.5 text-right font-display text-[clamp(1.4rem,2.2vw,1.9rem)] font-semibold leading-none tracking-[-0.045em] text-program sm:block">
						{item.year}
					</p>
					<div class="relative border-l-2 border-program/25 pl-6 {index === items.length - 1 ? 'border-transparent pb-0' : 'pb-10'}">
						<span class="absolute -left-[7px] top-1 size-3 bg-program ring-4 ring-paper" aria-hidden="true"></span>
						<p class="font-display text-[20px] font-semibold leading-none tracking-[-0.04em] text-program sm:hidden">{item.year}</p>
						<h3 class="mt-2 text-balance font-display text-[18px] font-semibold leading-snug tracking-[-0.02em] text-ink sm:mt-0 sm:text-[20px]">{item.title}</h3>
						{#if item.body}
							<div class="mt-2 max-w-[68ch] space-y-3 text-[15px] leading-relaxed text-ink-soft">
								{#each paragraphs(item.body) as paragraph, p (p)}<p>{paragraph}</p>{/each}
							</div>
						{/if}
					</div>
				</li>
			{/each}
		</ol>
	</div>
</section>
