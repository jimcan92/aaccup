<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Pause from '@lucide/svelte/icons/pause';
	import Play from '@lucide/svelte/icons/play';
	import Search from '@lucide/svelte/icons/search';
	import { MediaQuery } from 'svelte/reactivity';
	import DocumentRow from '#lib/components/site/document-row.svelte';
	import LandingBlocks from './landing-blocks.svelte';
	import ProgramContact from './program-contact.svelte';
	import { dossierPath, sectionsOf } from '#lib/data/accreditation.js';
	import { isLinked } from '#lib/drive-url.js';
	import type { Program, Visit } from '#lib/data/types.js';
	import { imageSrc } from '#lib/image-url.js';
	import { hasContent, type LandingBlock } from '#lib/landing.js';
	import { photo, snapPage } from '#lib/motion.js';

	let {
		program,
		visit,
		blocks,
		editable = false,
		drafts = []
	}: { program: Program; visit: Visit; blocks: LandingBlock[]; editable?: boolean; drafts?: string[] } = $props();

	const dossier = $derived(dossierPath(program, visit));

	// Sections snap into place on wide screens; not inside the admin preview frame.
	$effect(() => snapPage(!editable));

	// Program credentials (COPC, BOR, certification…): shown only once they are linked in Drive.
	const credentials = $derived(sectionsOf(visit, 'common').flatMap((section) => section.documents).filter(isLinked));

	// The first photo carousel becomes the hero's background slideshow instead of a section of its own.
	const heroCarousel = $derived(blocks.find((block) => block.kind === 'gallery' && block.content.layout === 'carousel' && block.content.items?.some((item) => item.src)));
	const slides = $derived(heroCarousel?.kind === 'gallery' ? heroCarousel.content.items.filter((item) => item.src) : []);
	const rest = $derived(heroCarousel ? blocks.filter((block) => block !== heroCarousel) : blocks);

	// Credentials continue the paper/salt alternation after the blocks that show.
	const shown = $derived(rest.filter(hasContent).length);

	const reducedMotion = new MediaQuery('prefers-reduced-motion: reduce', false);
	let slide = $state(0);
	let paused = $state(false);
	const playing = $derived(slides.length > 1 && !paused && !reducedMotion.current);

	$effect(() => {
		if (!playing) return;
		const timer = setInterval(() => (slide = (slide + 1) % slides.length), 6000);
		return () => clearInterval(timer);
	});

	// The banner behind the hero when there is no carousel, and the share image: the cover, else the first gallery photo.
	const banner = $derived.by(() => {
		if (program.cover) return { src: program.cover, alt: program.name };
		for (const block of blocks) if (block.kind === 'gallery' && block.content.items?.[0]?.src) return block.content.items[0];
		return null;
	});
</script>

<svelte:head>
	<title>{program.code} · {program.name} · AACCUP · CTU Moalboal</title>
	<meta name="description" content={program.summary || `${program.name} at CTU Moalboal — AACCUP ${visit.year} ${visit.label}.`} />
	{#if banner}<meta property="og:image" content={imageSrc(banner.src, 1200)} />{/if}
</svelte:head>

<!-- Hero -->
<!-- Fills the first screen below the header's tall size (two rows on phones and tablets, one on desktop). -->
<section class="on-program relative isolate flex min-h-[calc(100svh-7rem)] flex-col justify-center overflow-hidden bg-program text-program-contrast lg:min-h-[calc(100svh-7rem)]" aria-labelledby="program-title" data-snap>
	{#if slides.length}
		{#each slides as item, i (i)}
			<img
				src={imageSrc(item.src)}
				alt={i === slide ? item.alt : ''}
				aria-hidden={i !== slide}
				class="{i === 0 ? 'settle' : ''} absolute inset-0 -z-20 h-full w-full object-cover {i === slide ? 'opacity-100' : 'opacity-0'}"
				style="transition: opacity 1.5s ease-in-out, filter 0.8s ease-out, scale 1.6s var(--ease-out-soft)"
				fetchpriority={i === 0 ? 'high' : undefined}
				loading={i === 0 ? 'eager' : 'lazy'}
				use:photo
			/>
		{/each}
	{:else if banner}
		<img src={imageSrc(banner.src)} alt={banner.alt} class="settle absolute inset-0 -z-20 h-full w-full object-cover" fetchpriority="high" use:photo />
	{/if}
	{#if slides.length || banner}
		<div
			class="absolute inset-0 -z-10"
			style="background-image: linear-gradient(90deg, var(--program) 0%, color-mix(in srgb, var(--program) 88%, transparent) 42%, color-mix(in srgb, var(--program) 35%, transparent) 100%), linear-gradient(0deg, color-mix(in srgb, var(--program-ink) 55%, transparent), transparent 55%)"
			aria-hidden="true"
		></div>
		<!-- On narrow screens the text runs across the whole photo, so tint all of it. -->
		<div class="absolute inset-0 -z-10 bg-program/80 md:hidden" aria-hidden="true"></div>
	{/if}

	{#if slides.length > 1}
		<div class="absolute bottom-5 right-5 flex items-center gap-3 sm:right-8">
			<div class="flex gap-1.5">
				{#each slides as _, i (i)}
					<button
						type="button"
						onclick={() => (slide = i)}
						class="h-1.5 transition-all {i === slide ? 'w-6 bg-program-contrast' : 'w-1.5 bg-program-contrast/45 hover:bg-program-contrast/75'}"
						aria-label={`Show photo ${i + 1}`}
						aria-current={i === slide ? 'true' : undefined}
					></button>
				{/each}
			</div>
			{#if !reducedMotion.current}
				<button type="button" onclick={() => (paused = !paused)} class="grid size-8 place-items-center border border-program-contrast/40 hover:bg-program-contrast/10" aria-label={paused ? 'Play background slideshow' : 'Pause background slideshow'}>
					{#if paused}<Play class="size-3.5" />{:else}<Pause class="size-3.5" />{/if}
				</button>
			{/if}
		</div>
	{/if}

	<div class="mx-auto w-full max-w-[1280px] px-5 py-16 sm:px-8 lg:py-20">
		<div class="min-w-0 max-w-5xl">
			{#if program.logo}
				<img src={imageSrc(program.logo, 400)} alt={`${program.code} logo`} class="rise mb-6 size-20 bg-program-contrast object-contain p-2 shadow-[0_10px_30px_-12px_rgb(0_0_0/0.5)] sm:size-24" />
			{/if}
			<p class="rise font-mono text-[13px] opacity-85 sm:text-[14px]">AACCUP · {visit.year} · {visit.label}</p>
			<h1 id="program-title" class="rise mt-4 font-display text-[clamp(5rem,17vw,13rem)] font-semibold leading-[0.78] tracking-[-0.075em]">
				{program.code}
			</h1>
			<p class="rise rise-2 mt-6 text-balance font-display text-[clamp(1.6rem,3.6vw,3rem)] font-medium leading-[1.05] tracking-[-0.035em]">
				{program.name}
			</p>
			{#if program.tagline}
				<p class="mt-3 text-pretty font-display text-[clamp(1.15rem,2.2vw,1.65rem)] font-medium italic tracking-[-0.01em] opacity-90">{program.tagline}</p>
			{/if}
			{#if program.summary}
				<p class="mt-5 max-w-3xl text-pretty text-[17px] leading-relaxed opacity-90 sm:text-[19px]">{program.summary}</p>
			{/if}
			<div class="rise rise-3 mt-10 flex flex-wrap gap-3">
				<a href={dossier} class="inline-flex h-14 items-center gap-2 bg-program-contrast px-7 text-[15px] font-semibold text-program transition-opacity hover:opacity-90">
					Open the documents
					<ArrowRight class="size-4" />
				</a>
				<a href={`/${program.slug}/documents`} class="inline-flex h-14 items-center gap-2 border border-program-contrast/50 px-7 text-[15px] font-medium transition-colors hover:bg-program-contrast/10">
					<Search class="size-4" />
					Search documents
				</a>
			</div>
			<ProgramContact {program} variant="chips" />
		</div>

	</div>
</section>

<!-- Landing blocks, in the order set in the admin -->
<LandingBlocks blocks={rest} {editable} {drafts} />

{#if credentials.length}
	<section class="border-b border-rule {shown % 2 === 0 ? 'bg-paper' : 'bg-salt'}" aria-labelledby="credentials-heading" data-snap>
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

<ProgramContact {program} variant="section" />
