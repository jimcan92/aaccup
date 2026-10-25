<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import X from '@lucide/svelte/icons/x';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import PhotoCarousel from './photo-carousel.svelte';
	import ProgramTimeline from './program-timeline.svelte';
	import CtaBlock from './blocks/cta-block.svelte';
	import FaqBlock from './blocks/faq-block.svelte';
	import MediaBlock from './blocks/media-block.svelte';
	import NewsBlock from './blocks/news-block.svelte';
	import PartnersBlock from './blocks/partners-block.svelte';
	import PeopleBlock from './blocks/people-block.svelte';
	import TestimonialsBlock from './blocks/testimonials-block.svelte';
	import VideoBlock from './blocks/video-block.svelte';
	import VmgoBlock from './blocks/vmgo-block.svelte';
	import EventsBlock from './blocks/events-block.svelte';
	import OrgBlock from './blocks/org-block.svelte';
	import { imageSrc, paragraphs } from '#lib/image-url.js';
	import { hasContent, type GalleryItem, type LandingBlock } from '#lib/landing.js';
	import Photo from '#lib/components/site/photo.svelte';
	import { reveal, stagger } from '#lib/motion.js';

	// Landing blocks in the order set in the admin, for a program page or the home page.
	// In the admin preview (editable) each block is a click target, and blocks not yet live are tagged.
	let { blocks, editable = false, drafts = [] }: { blocks: LandingBlock[]; editable?: boolean; drafts?: string[] } = $props();

	// Only blocks with something to show; backgrounds alternate paper and salt down the page.
	const visible = $derived(blocks.filter(hasContent));
	const tone = (index: number) => (index % 2 === 0 ? 'paper' : 'salt') as 'paper' | 'salt';
	const background = { paper: 'bg-paper', salt: 'bg-salt' };

	// Lightbox for gallery photos.
	let viewer = $state<{ items: GalleryItem[]; index: number } | null>(null);
	const current = $derived(viewer ? viewer.items[viewer.index] : null);

	function step(delta: number) {
		if (!viewer) return;
		const count = viewer.items.length;
		viewer = { ...viewer, index: (viewer.index + delta + count) % count };
	}
</script>

{#each visible as block, index (block.id)}
<!-- Each block is a snap point, and its content rises in the first time it scrolls into view. -->
<div data-block-id={editable ? block.id : undefined} class={editable ? 'relative cursor-pointer hover:outline-[3px] hover:outline-solid hover:outline-program hover:[outline-offset:-3px]' : ''} data-snap use:reveal={{ inner: true, disabled: editable }}>
	{#if editable && drafts.includes(block.id)}<span class="pointer-events-none absolute right-3 top-3 z-10 bg-ink px-2 py-1 font-mono text-[11px] text-paper">Not live yet</span>{/if}
	{#if block.kind === 'stats'}
		<section class="border-b border-rule {background[tone(index)]}">
			<div class="mx-auto max-w-[1280px] px-5 py-12 sm:px-8">
				{#if block.content.title}<h2 class="font-display text-[clamp(1.4rem,2.6vw,1.9rem)] font-semibold tracking-[-0.035em]">{block.content.title}</h2>{/if}
				<dl class="mt-6 grid grid-cols-2 gap-px border border-rule bg-rule md:grid-cols-4">
					{#each block.content.items as item, index (index)}
						<div class="bg-paper p-5" use:reveal={{ delay: stagger(index), disabled: editable }}>
							<dd class="font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-none tracking-[-0.05em] text-program">{item.value}</dd>
							<dt class="mt-2 text-[13px] leading-snug text-ink-soft">{item.label}</dt>
						</div>
					{/each}
				</dl>
			</div>
		</section>
	{:else if block.kind === 'text'}
		<section class="border-b border-rule {background[tone(index)]}">
			<div class="mx-auto grid max-w-[1280px] gap-6 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
				{#if block.content.title}
					<h2 class="text-balance font-display text-[clamp(1.6rem,3.2vw,2.6rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-ink">{block.content.title}</h2>
				{/if}
				<div class="max-w-[68ch] space-y-4 text-[15px] leading-relaxed text-ink-soft sm:text-[16px] {block.content.title ? '' : 'lg:col-start-2'}">
					{#each paragraphs(block.content.body) as paragraph, index (index)}<p>{paragraph}</p>{/each}
				</div>
			</div>
		</section>
	{:else if block.kind === 'people'}
		<PeopleBlock content={block.content} tone={tone(index)} />
	{:else if block.kind === 'vmgo'}
		<VmgoBlock content={block.content} tone={tone(index)} />
	{:else if block.kind === 'media'}
		<MediaBlock content={block.content} tone={tone(index)} />
	{:else if block.kind === 'partners'}
		<PartnersBlock content={block.content} tone={tone(index)} />
	{:else if block.kind === 'testimonials'}
		<TestimonialsBlock content={block.content} tone={tone(index)} />
	{:else if block.kind === 'faq'}
		<FaqBlock content={block.content} tone={tone(index)} />
	{:else if block.kind === 'video'}
		<VideoBlock content={block.content} tone={tone(index)} />
	{:else if block.kind === 'cta'}
		<CtaBlock content={block.content} />
	{:else if block.kind === 'news'}
		<NewsBlock content={block.content} tone={tone(index)} />
	{:else if block.kind === 'org'}
		<OrgBlock content={block.content} tone={tone(index)} />
	{:else if block.kind === 'events'}
		<EventsBlock content={block.content} tone={tone(index)} />
	{:else if block.kind === 'timeline'}
		<ProgramTimeline items={block.content.items} title={block.content.title} tone={tone(index)} />
	{:else if block.kind === 'gallery' && block.content.layout === 'carousel'}
		<PhotoCarousel items={block.content.items} title={block.content.title} tone={tone(index)} onopen={(index) => (viewer = { items: block.content.items, index })} />
	{:else if block.kind === 'gallery'}
		<section class="border-b border-rule {background[tone(index)]}">
			<div class="mx-auto max-w-[1280px] px-5 py-12 sm:px-8">
				{#if block.content.title}<h2 class="font-display text-[clamp(1.4rem,2.6vw,1.9rem)] font-semibold tracking-[-0.035em]">{block.content.title}</h2>{/if}
				<ul class="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
					{#each block.content.items as item, index (index)}
						<li class={index === 0 && block.content.items.length > 2 ? 'col-span-2 row-span-2' : ''} use:reveal={{ delay: stagger(index), disabled: editable }}>
							<figure class="h-full">
								<button
									type="button"
									onclick={() => (viewer = { items: block.content.items, index })}
									class="group block aspect-[4/3] h-auto w-full overflow-hidden bg-salt {index === 0 && block.content.items.length > 2 ? 'md:aspect-auto md:h-[calc(100%-1.75rem)]' : ''}"
									aria-label={`View photo: ${item.caption || item.alt}`}
								>
									<Photo src={item.src} alt={item.alt} class="h-full w-full" imgClass="group-hover:scale-[1.03]" />
								</button>
								{#if item.caption}<figcaption class="mt-2 truncate text-[13px] text-ink-soft">{item.caption}</figcaption>{/if}
							</figure>
						</li>
					{/each}
				</ul>
			</div>
		</section>
	{/if}
</div>
{/each}

<Dialog.Root open={viewer !== null} onOpenChange={(open) => !open && (viewer = null)}>
	<Dialog.Content
		class="max-w-[min(96vw,72rem)] gap-0 rounded-none border-none bg-ink p-0 text-paper sm:max-w-[min(96vw,72rem)]"
		showCloseButton={false}
		onkeydown={(event: KeyboardEvent) => {
			if (event.key === 'ArrowRight') step(1);
			if (event.key === 'ArrowLeft') step(-1);
		}}
	>
		{#if current && viewer}
			<Dialog.Title class="sr-only">{current.caption || current.alt}</Dialog.Title>
			<Dialog.Description class="sr-only">Photo {viewer.index + 1} of {viewer.items.length}</Dialog.Description>
			<div class="relative grid place-items-center bg-black">
				<img src={imageSrc(current.src, 2000)} alt={current.alt} class="max-h-[78vh] w-auto max-w-full object-contain" />
				{#if viewer.items.length > 1}
					<button type="button" onclick={() => step(-1)} class="absolute left-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center bg-ink/70 hover:bg-ink" aria-label="Previous photo"><ChevronLeft class="size-5" /></button>
					<button type="button" onclick={() => step(1)} class="absolute right-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center bg-ink/70 hover:bg-ink" aria-label="Next photo"><ChevronRight class="size-5" /></button>
				{/if}
			</div>
			<div class="flex items-center justify-between gap-4 px-4 py-3 text-[13px]">
				<span class="min-w-0 truncate">{current.caption || current.alt}</span>
				<span class="flex shrink-0 items-center gap-3">
					<span class="font-mono text-[12px] text-paper/70">{viewer.index + 1} / {viewer.items.length}</span>
					<Dialog.Close class="grid size-9 place-items-center hover:bg-paper/10" aria-label="Close photo"><X class="size-4" /></Dialog.Close>
				</span>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
