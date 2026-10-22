<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Search from '@lucide/svelte/icons/search';
	import X from '@lucide/svelte/icons/x';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import DocumentRow from '$lib/components/site/document-row.svelte';
	import PhotoCarousel from './photo-carousel.svelte';
	import ProgramTimeline from './program-timeline.svelte';
	import { dossierPath, sectionsOf } from '$lib/data/accreditation';
	import { isLinked } from '$lib/drive-url';
	import type { Program, Visit } from '$lib/data/types';
	import { imageSrc, paragraphs } from '$lib/image-url';
	import type { GalleryItem, LandingBlock } from '$lib/landing';

	let { program, visit, blocks }: { program: Program; visit: Visit; blocks: LandingBlock[] } = $props();

	const dossier = $derived(dossierPath(program, visit));

	// Program credentials (COPC, BOR, certification…): shown only once they are linked in Drive.
	const credentials = $derived(sectionsOf(visit, 'common').flatMap((section) => section.documents).filter(isLinked));

	// The first photo of the first gallery is the banner behind the hero.
	const banner = $derived.by(() => {
		for (const block of blocks) if (block.kind === 'gallery' && block.content.items?.[0]?.src) return block.content.items[0];
		return null;
	});

	// Lightbox for gallery photos.
	let viewer = $state<{ items: GalleryItem[]; index: number } | null>(null);
	const current = $derived(viewer ? viewer.items[viewer.index] : null);

	function step(delta: number) {
		if (!viewer) return;
		const count = viewer.items.length;
		viewer = { ...viewer, index: (viewer.index + delta + count) % count };
	}
</script>

<svelte:head>
	<title>{program.code} · {program.name} · AACCUP · CTU Moalboal</title>
	<meta name="description" content={program.summary || `${program.name} at CTU Moalboal — AACCUP ${visit.year} ${visit.label}.`} />
	{#if banner}<meta property="og:image" content={imageSrc(banner.src, 1200)} />{/if}
</svelte:head>

<!-- Hero -->
<section class="on-program relative isolate overflow-hidden bg-program text-program-contrast" aria-labelledby="program-title">
	{#if banner}
		<img src={imageSrc(banner.src)} alt={banner.alt} class="absolute inset-0 -z-20 h-full w-full object-cover" fetchpriority="high" />
		<div
			class="absolute inset-0 -z-10"
			style="background-image: linear-gradient(90deg, var(--program) 0%, color-mix(in srgb, var(--program) 88%, transparent) 42%, color-mix(in srgb, var(--program) 35%, transparent) 100%), linear-gradient(0deg, color-mix(in srgb, var(--program-ink) 55%, transparent), transparent 55%)"
			aria-hidden="true"
		></div>
		<!-- On narrow screens the text runs across the whole photo, so tint all of it. -->
		<div class="absolute inset-0 -z-10 bg-program/80 md:hidden" aria-hidden="true"></div>
	{/if}

	<div class="mx-auto max-w-[1280px] px-5 py-16 sm:px-8 lg:py-28">
		<div class="min-w-0 max-w-3xl">
			<p class="font-mono text-[12px] opacity-85">AACCUP · {visit.year} · {visit.label}</p>
			<h1 id="program-title" class="mt-3 font-display text-[clamp(4rem,14vw,9rem)] font-semibold leading-[0.78] tracking-[-0.075em]">
				{program.code}
			</h1>
			<p class="mt-4 text-balance font-display text-[clamp(1.3rem,2.8vw,2.1rem)] font-medium leading-tight tracking-[-0.03em]">
				{program.name}
			</p>
			{#if program.summary}
				<p class="mt-4 max-w-2xl text-pretty text-[15px] leading-relaxed opacity-90 sm:text-[16px]">{program.summary}</p>
			{/if}
			<div class="mt-8 flex flex-wrap gap-3">
				<a href={dossier} class="inline-flex h-12 items-center gap-2 bg-program-contrast px-5 text-[14px] font-semibold text-program transition-opacity hover:opacity-90">
					Open the documents
					<ArrowRight class="size-4" />
				</a>
				<a href={`/${program.slug}/documents`} class="inline-flex h-12 items-center gap-2 border border-program-contrast/50 px-5 text-[14px] font-medium transition-colors hover:bg-program-contrast/10">
					<Search class="size-4" />
					Search documents
				</a>
			</div>
		</div>

	</div>
</section>

<!-- Landing blocks, in the order set in the admin -->
{#each blocks as block (block.id)}
	{#if block.kind === 'stats' && block.content.items?.length}
		<section class="border-b border-rule bg-paper">
			<div class="mx-auto max-w-[1280px] px-5 py-12 sm:px-8">
				{#if block.content.title}<h2 class="font-display text-[clamp(1.4rem,2.6vw,1.9rem)] font-semibold tracking-[-0.035em]">{block.content.title}</h2>{/if}
				<dl class="mt-6 grid grid-cols-2 gap-px border border-rule bg-rule md:grid-cols-4">
					{#each block.content.items as item, index (index)}
						<div class="bg-paper p-5">
							<dd class="font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-none tracking-[-0.05em] text-program">{item.value}</dd>
							<dt class="mt-2 text-[13px] leading-snug text-ink-soft">{item.label}</dt>
						</div>
					{/each}
				</dl>
			</div>
		</section>
	{:else if block.kind === 'text' && (block.content.title || block.content.body)}
		<section class="border-b border-rule bg-salt">
			<div class="mx-auto grid max-w-[1280px] gap-6 px-5 py-14 sm:px-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
				{#if block.content.title}
					<h2 class="text-balance font-display text-[clamp(1.6rem,3.2vw,2.6rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-ink">{block.content.title}</h2>
				{/if}
				<div class="max-w-[68ch] space-y-4 text-[15px] leading-relaxed text-ink-soft sm:text-[16px] {block.content.title ? '' : 'lg:col-start-2'}">
					{#each paragraphs(block.content.body) as paragraph, index (index)}<p>{paragraph}</p>{/each}
				</div>
			</div>
		</section>
	{:else if block.kind === 'timeline' && block.content.items?.length}
		<ProgramTimeline items={block.content.items} title={block.content.title} />
	{:else if block.kind === 'gallery' && block.content.layout === 'carousel' && block.content.items?.length}
		<PhotoCarousel items={block.content.items} title={block.content.title} onopen={(index) => (viewer = { items: block.content.items, index })} />
	{:else if block.kind === 'gallery' && block.content.items?.length}
		<section class="border-b border-rule bg-paper">
			<div class="mx-auto max-w-[1280px] px-5 py-12 sm:px-8">
				{#if block.content.title}<h2 class="font-display text-[clamp(1.4rem,2.6vw,1.9rem)] font-semibold tracking-[-0.035em]">{block.content.title}</h2>{/if}
				<ul class="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
					{#each block.content.items as item, index (index)}
						<li class={index === 0 && block.content.items.length > 2 ? 'col-span-2 row-span-2' : ''}>
							<figure class="h-full">
								<button
									type="button"
									onclick={() => (viewer = { items: block.content.items, index })}
									class="group block aspect-[4/3] h-auto w-full overflow-hidden bg-salt {index === 0 && block.content.items.length > 2 ? 'md:aspect-auto md:h-[calc(100%-1.75rem)]' : ''}"
									aria-label={`View photo: ${item.caption || item.alt}`}
								>
									<img src={imageSrc(item.src, 1200)} alt={item.alt} loading="lazy" class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
								</button>
								{#if item.caption}<figcaption class="mt-2 truncate text-[13px] text-ink-soft">{item.caption}</figcaption>{/if}
							</figure>
						</li>
					{/each}
				</ul>
			</div>
		</section>
	{/if}
{/each}

{#if credentials.length}
	<section class="border-b border-rule bg-paper" aria-labelledby="credentials-heading">
		<div class="mx-auto max-w-[1280px] px-5 py-12 sm:px-8">
			<h2 id="credentials-heading" class="font-display text-[clamp(1.4rem,2.6vw,1.9rem)] font-semibold tracking-[-0.035em]">Credentials</h2>
			<div class="mt-5 border-t border-rule">
				{#each credentials as document (document.id)}
					<DocumentRow {document} />
				{/each}
			</div>
		</div>
	</section>
{/if}

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
