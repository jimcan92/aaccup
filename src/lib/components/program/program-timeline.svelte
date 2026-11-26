<script lang="ts">
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Expand from '@lucide/svelte/icons/expand';
	import X from '@lucide/svelte/icons/x';
	import Photo from '#lib/components/site/photo.svelte';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { imageSrc, paragraphs } from '#lib/image-url.js';
	import type { TimelineItem } from '#lib/landing.js';

	let { items, title, tone = 'paper' }: { items: TimelineItem[]; title?: string; tone?: 'paper' | 'salt' } = $props();

	const id = $props.id();

	// Each card shows the start of its story. On a card without a photo, "Read more" opens the rest in place,
	// one card or all at once; a photo card opens in a dialog with the photo and the whole story.
	let open = $state<boolean[]>([]);
	let viewing = $state<number | null>(null);
	const viewed = $derived(viewing === null ? null : items[viewing]);
	const stories = $derived(items.map((item) => paragraphs(item.body)));
	const longer = (index: number) => stories[index].length > 1 || (stories[index][0]?.length ?? 0) > 160;
	const inline = (index: number) => longer(index) && !items[index].photo;
	const withMore = $derived(items.filter((_, index) => inline(index)).length);
	const allOpen = $derived(withMore > 0 && items.every((_, index) => !inline(index) || open[index]));

	function toggleAll() {
		const next = !allOpen;
		open = items.map((_, index) => inline(index) && next);
	}

	// Literal class names so Tailwind keeps them; cards and the marker ring contrast with the section.
	const background = { paper: 'bg-paper', salt: 'bg-salt' };
	const card = { paper: 'bg-salt/70', salt: 'bg-paper' };
	const ring = { paper: 'ring-paper', salt: 'ring-salt' };
</script>

<!--
	Milestones along a centre line, cards alternating left and right on wide screens and down one
	side on phones. The last entry (usually "Today") is filled with the program colour.
-->
<section class="border-b border-rule {background[tone]}" aria-labelledby={title ? `${id}-heading` : undefined}>
	<div class="mx-auto max-w-[1280px] px-5 py-16 sm:px-8">
		<div class="mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-4">
			<div>
				{#if title}
					<h2 id={`${id}-heading`} class="text-balance font-display text-[clamp(1.8rem,3.6vw,2.9rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-ink">{title}</h2>
				{/if}
				{#if items.length > 1}
					<p class="mt-2 font-mono text-[12px] text-ink-soft">{items[0].year} – {items.at(-1)?.year} · {items.length} milestones</p>
				{/if}
			</div>
			{#if withMore > 1}
				<button type="button" onclick={toggleAll} class="inline-flex h-9 cursor-pointer items-center gap-1.5 border border-rule bg-paper px-3 text-[13px] font-medium text-ink-soft hover:border-ink/30 hover:text-ink" aria-expanded={allOpen}>
					{allOpen ? 'Show less' : 'Read everything'}
					<ChevronDown class="size-4 transition-transform {allOpen ? 'rotate-180' : ''}" />
				</button>
			{/if}
		</div>

		<!-- Wide screens: each card spans two grid rows and the next starts one row down, so cards interlock. -->
		<ol class="relative mx-auto mt-12 max-w-5xl md:grid md:grid-cols-2 md:gap-x-16">
			<!-- The line: down the left on phones, down the middle on wide screens. -->
			<span class="absolute bottom-6 left-[7px] top-6 w-0.5 bg-gradient-to-b from-program/10 via-program/35 to-program md:left-1/2 md:-translate-x-1/2" aria-hidden="true"></span>

			{#each items as item, index (index)}
				{@const left = index % 2 === 0}
				{@const last = index === items.length - 1}
				{@const story = stories[index]}
				{@const overlay = Boolean(item.photo)}
				<li class="relative pb-8 last:pb-0 md:pb-6 {left ? 'md:col-start-1' : 'md:col-start-2'}" style:grid-row={`${index + 1} / span 2`}>
					<!-- The marker sits on the line: left edge on phones, the centre (between the columns) on wide screens. -->
					<span
						class="absolute left-0 top-7 size-4 rotate-45 ring-4 {left ? 'md:left-auto md:-right-10' : 'md:-left-10'} {ring[tone]} {last ? 'bg-program' : 'border-2 border-program bg-paper'}"
						aria-hidden="true"
					></span>

					<article
						class="relative ml-9 border shadow-[0_10px_30px_-22px_rgb(0_0_0/0.45)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-20px_rgb(0_0_0/0.5)] md:ml-0 {overlay ? '' : 'p-5 sm:p-6'} {last ? 'on-program border-program bg-program text-program-contrast' : `border-rule ${card[tone]}`}"
					>
						<!-- A short tick joins the card to the centre line on wide screens. -->
						<span class="absolute top-[34px] hidden h-0.5 w-8 bg-program/35 md:block {left ? '-right-8' : '-left-8'}" aria-hidden="true"></span>

						{#if overlay}
							<!-- Photo card: the year, title and first lines sit on a gradient over the bottom of the photo. -->
							<div class="relative aspect-square overflow-hidden sm:aspect-[4/3]">
								<button type="button" onclick={() => (viewing = index)} class="group/photo absolute inset-0 block cursor-zoom-in" aria-label={`View photo: ${item.title}`}>
									<Photo src={item.photo ?? ''} alt="" width={900} class="h-full w-full" imgClass="transition-transform duration-500 group-hover/photo:scale-[1.03]" />
									<span class="absolute right-2 top-2 grid size-8 place-items-center bg-black/60 text-white opacity-0 transition-opacity group-hover/photo:opacity-100 group-focus-visible/photo:opacity-100" aria-hidden="true"><Expand class="size-4" /></span>
								</button>
								<div class="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent px-5 pb-4 pt-16 sm:pt-20 text-white sm:px-6">
									<p class="font-display text-[clamp(1.7rem,3vw,2.3rem)] font-semibold leading-none tracking-[-0.05em]">{item.year}</p>
									<h3 class="mt-1.5 text-balance font-display text-[16px] font-semibold leading-snug tracking-[-0.02em] sm:text-[17px]">{item.title}</h3>
									{#if story.length}
										<p class="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-white/80">{story[0]}</p>
										{#if longer(index)}
											<button type="button" onclick={() => (viewing = index)} class="pointer-events-auto mt-2 inline-flex cursor-pointer items-center gap-1 text-[12.5px] font-semibold text-white hover:underline hover:underline-offset-4" aria-haspopup="dialog">
												Read more <ArrowUpRight class="size-4" />
											</button>
										{/if}
									{/if}
								</div>
							</div>
						{:else}
							<p class="font-display text-[clamp(2.1rem,4vw,3.1rem)] font-semibold leading-none tracking-[-0.06em] {last ? '' : 'text-program'}">{item.year}</p>
							<h3 class="mt-2 text-balance font-display text-[18px] font-semibold leading-snug tracking-[-0.02em] sm:text-[19px] {last ? '' : 'text-ink'}">{item.title}</h3>

							{#if story.length}
								<div class="mt-2.5 space-y-3 text-[14.5px] leading-relaxed {last ? 'opacity-90' : 'text-ink-soft'}">
									{#if open[index]}
										{#each story as paragraph, p (p)}<p>{paragraph}</p>{/each}
									{:else}
										<p class="line-clamp-3">{story[0]}</p>
									{/if}
								</div>
								{#if inline(index)}
									<button
										type="button"
										onclick={() => (open[index] = !open[index])}
										class="mt-3 inline-flex cursor-pointer items-center gap-1 text-[13px] font-semibold {last ? '' : 'text-program'} hover:underline hover:underline-offset-4"
										aria-expanded={Boolean(open[index])}
									>
										{open[index] ? 'Show less' : 'Read more'}
										<ChevronDown class="size-4 transition-transform {open[index] ? 'rotate-180' : ''}" />
									</button>
								{/if}
							{/if}
						{/if}
					</article>
				</li>
			{/each}
		</ol>
	</div>
</section>

<Dialog.Root open={viewing !== null} onOpenChange={(value) => !value && (viewing = null)}>
	<Dialog.Content class="max-h-[94dvh] max-w-[min(96vw,64rem)] gap-0 overflow-y-auto rounded-none border-none bg-paper p-0 sm:max-w-[min(96vw,64rem)]" showCloseButton={false}>
		{#if viewed}
			<div>
				{#if viewed.photo}
					<div class="grid place-items-center bg-black">
						<img src={imageSrc(viewed.photo, 2400)} alt={viewed.title} class="max-h-[64dvh] w-auto max-w-full object-contain" />
					</div>
				{/if}
				<div class="relative p-6 sm:p-8">
					<Dialog.Close class="absolute right-3 top-3 grid size-9 place-items-center text-ink-soft hover:bg-salt hover:text-ink" aria-label="Close"><X class="size-5" /></Dialog.Close>
					<p class="font-display text-[clamp(1.9rem,3.6vw,2.6rem)] font-semibold leading-none tracking-[-0.05em] text-program">{viewed.year}</p>
					<Dialog.Title class="mt-2 pr-10 text-balance font-display text-[clamp(1.2rem,2.4vw,1.5rem)] font-semibold leading-snug tracking-[-0.02em] text-ink">{viewed.title}</Dialog.Title>
					<Dialog.Description class="sr-only">Milestone details</Dialog.Description>
					{#if viewing !== null && stories[viewing].length}
						<div class="mt-3 max-w-[68ch] space-y-3 text-[15px] leading-relaxed text-ink-soft">
							{#each stories[viewing] as paragraph, p (p)}<p>{paragraph}</p>{/each}
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
