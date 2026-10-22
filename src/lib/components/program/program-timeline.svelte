<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import { paragraphs } from '$lib/image-url';
	import type { TimelineItem } from '$lib/landing';

	let { items, title, tone = 'paper' }: { items: TimelineItem[]; title?: string; tone?: 'paper' | 'salt' } = $props();

	const id = $props.id();

	// Details start folded so a long history stays short; each entry opens on its own, or all at once.
	let open = $state<boolean[]>([]);
	const withDetails = $derived(items.filter((item) => item.body).length);
	const allOpen = $derived(withDetails > 0 && items.every((item, index) => !item.body || open[index]));

	function toggleAll() {
		const next = !allOpen;
		open = items.map((item) => Boolean(item.body) && next);
	}

	// Literal class names so Tailwind keeps them; the dot's ring matches the section background.
	const background = { paper: 'bg-paper', salt: 'bg-salt' };
	const ring = { paper: 'ring-paper', salt: 'ring-salt' };
</script>

<!-- Milestones down a line: the year sits left of the line on wide screens and above the title on phones. -->
<section class="border-b border-rule {background[tone]}" aria-labelledby={title ? `${id}-heading` : undefined}>
	<div class="mx-auto max-w-[1280px] px-5 py-14 sm:px-8">
		<div class="flex max-w-4xl flex-wrap items-end justify-between gap-4">
			{#if title}
				<h2 id={`${id}-heading`} class="text-balance font-display text-[clamp(1.6rem,3.2vw,2.6rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-ink">{title}</h2>
			{/if}
			{#if withDetails > 1}
				<button type="button" onclick={toggleAll} class="ml-auto inline-flex h-9 cursor-pointer items-center gap-1.5 border border-rule px-3 text-[13px] font-medium text-ink-soft hover:border-ink/30 hover:text-ink" aria-expanded={allOpen}>
					{allOpen ? 'Collapse all' : 'Expand all'}
					<ChevronDown class="size-4 transition-transform {allOpen ? 'rotate-180' : ''}" />
				</button>
			{/if}
		</div>

		<ol class="mt-8 max-w-4xl">
			{#each items as item, index (index)}
				<li class="grid sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-8">
					<p class="hidden pt-0.5 text-right font-display text-[clamp(1.4rem,2.2vw,1.9rem)] font-semibold leading-none tracking-[-0.045em] text-program sm:block">
						{item.year}
					</p>
					<div class="relative border-l-2 border-program/25 pl-6 {index === items.length - 1 ? 'border-transparent pb-0' : 'pb-7'}">
						<span class="absolute -left-[7px] top-1 size-3 bg-program ring-4 {ring[tone]}" aria-hidden="true"></span>
						<p class="font-display text-[20px] font-semibold leading-none tracking-[-0.04em] text-program sm:hidden">{item.year}</p>
						{#if item.body}
							<details bind:open={open[index]} class="group mt-2 sm:mt-0">
								<summary class="flex cursor-pointer list-none items-start gap-2 [&::-webkit-details-marker]:hidden">
									<h3 class="text-balance font-display text-[18px] font-semibold leading-snug tracking-[-0.02em] text-ink group-hover:text-program sm:text-[20px]">{item.title}</h3>
									<ChevronDown class="mt-1 size-5 shrink-0 text-ink-soft transition-transform group-open:rotate-180 sm:mt-1.5" aria-hidden="true" />
								</summary>
								<div class="mt-2 max-w-[68ch] space-y-3 text-[15px] leading-relaxed text-ink-soft">
									{#each paragraphs(item.body) as paragraph, p (p)}<p>{paragraph}</p>{/each}
								</div>
							</details>
						{:else}
							<h3 class="mt-2 text-balance font-display text-[18px] font-semibold leading-snug tracking-[-0.02em] text-ink sm:mt-0 sm:text-[20px]">{item.title}</h3>
						{/if}
					</div>
				</li>
			{/each}
		</ol>
	</div>
</section>
