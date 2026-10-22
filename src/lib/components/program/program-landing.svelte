<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Search from '@lucide/svelte/icons/search';
	import DocumentRow from '$lib/components/site/document-row.svelte';
	import LandingBlocks from './landing-blocks.svelte';
	import { dossierPath, sectionsOf } from '$lib/data/accreditation';
	import { isLinked } from '$lib/drive-url';
	import type { Program, Visit } from '$lib/data/types';
	import { imageSrc } from '$lib/image-url';
	import { hasContent, type LandingBlock } from '$lib/landing';

	let { program, visit, blocks }: { program: Program; visit: Visit; blocks: LandingBlock[] } = $props();

	const dossier = $derived(dossierPath(program, visit));

	// Program credentials (COPC, BOR, certification…): shown only once they are linked in Drive.
	const credentials = $derived(sectionsOf(visit, 'common').flatMap((section) => section.documents).filter(isLinked));

	// Credentials continue the paper/salt alternation after the blocks that show.
	const shown = $derived(blocks.filter(hasContent).length);

	// The first photo of the first gallery is the banner behind the hero.
	const banner = $derived.by(() => {
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
<LandingBlocks {blocks} />

{#if credentials.length}
	<section class="border-b border-rule {shown % 2 === 0 ? 'bg-paper' : 'bg-salt'}" aria-labelledby="credentials-heading">
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
