<script lang="ts">
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import Search from '@lucide/svelte/icons/search';
	import AreaTable from '$lib/components/site/area-table.svelte';
	import DocumentRow from '$lib/components/site/document-row.svelte';
	import HeroMap from '$lib/components/site/hero-map.svelte';
	import InstitutionalCard from '$lib/components/site/institutional-card.svelte';
	import ProgramSpines from '$lib/components/site/program-spines.svelte';
	import SectionHeading from '$lib/components/site/section-heading.svelte';
	import {
		countLinked,
		documentIndex,
		institutionalDocuments,
		programs
	} from '$lib/data/accreditation';
	import { site } from '$lib/data/site';
	import type { ProgramSlug } from '$lib/data/types';
	import { pad2 } from '$lib/format';

	let activeProgram = $state<ProgramSlug>('bsfi');
	const active = $derived(programs.find((program) => program.slug === activeProgram) ?? programs[0]);

	const activeLinked = $derived(
		[...active.areas.flatMap((area) => area.documents), ...active.programDocuments].filter(
			(document) => document.status === 'linked'
		).length
	);
	const activeTotal = $derived(
		[...active.areas.flatMap((area) => area.documents), ...active.programDocuments].length
	);

	const featured = $derived(
		documentIndex()
			.filter((document) => document.status === 'linked' && document.scope === 'area')
			.sort((a, b) => (b.updated ?? '').localeCompare(a.updated ?? ''))
			.slice(0, 4)
	);

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'EducationalOrganization',
		name: 'Cebu Technological University — Moalboal Campus',
		alternateName: 'CTU Moalboal',
		description: site.description,
		address: {
			'@type': 'PostalAddress',
			addressLocality: 'Moalboal',
			addressRegion: 'Cebu',
			addressCountry: 'PH'
		}
	};
</script>

<svelte:head>
	<title>{site.title}</title>
	<meta name="description" content={site.description} />
	<meta property="og:title" content={site.title} />
	<meta property="og:description" content={site.description} />
	<meta property="og:type" content="website" />
	{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`}
</svelte:head>

<section class="relative overflow-hidden bg-ink text-paper">
	<div class="pointer-events-none absolute inset-0 text-foam opacity-[0.11]" aria-hidden="true">
		<HeroMap />
	</div>

	<div
		class="relative mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-14 px-5 pb-16 pt-14 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-10 lg:pb-24 lg:pt-20"
	>
		<div class="min-w-0 max-w-[44rem]">
			<div class="flex items-center gap-3 font-mono text-[10px] text-paper/55">
				<span class="h-px w-8 bg-paper/30" aria-hidden="true"></span>
				<span>AACCUP Level III · {site.surveyYear}</span>
			</div>

			<h1
				class="mt-6 text-balance font-display text-[clamp(3rem,6.2vw,5.8rem)] font-semibold leading-[0.9] tracking-[-0.06em]"
			>
				Two programs.<br />One clear record.
			</h1>

			<p class="mt-6 max-w-xl text-pretty text-[15px] leading-relaxed text-paper/65 sm:text-base">
				{site.intro}
			</p>

			<div class="mt-8 flex flex-col gap-3 sm:flex-row">
				<a
					href="#areas"
					class="inline-flex h-11 items-center justify-center gap-2 bg-paper px-5 text-[13px] font-medium text-ink transition-colors hover:bg-white"
				>
					Browse the area index
					<ArrowDown class="size-4" />
				</a>
				<a
					href="/documents"
					class="inline-flex h-11 items-center justify-center gap-2 border border-paper/25 px-5 text-[13px] font-medium text-paper transition-colors hover:bg-paper/10"
				>
					<Search class="size-4" />
					Find a document
				</a>
			</div>
		</div>

		<ProgramSpines {programs} />
	</div>

	<div class="relative border-t border-paper/10">
		<div
			class="mx-auto flex max-w-[1280px] flex-col gap-2 px-5 py-4 font-mono text-[10px] text-paper/45 sm:flex-row sm:items-center sm:justify-between sm:px-8"
		>
			<span>{site.campus}</span>
			<span class="flex items-center gap-4">
				<span>BSIE · BSFI</span>
				<span>{site.level}</span>
				<span>{site.surveyYear}</span>
			</span>
		</div>
	</div>
</section>

<section id="areas" class="scroll-mt-20 border-b border-rule bg-salt">
	<div class="mx-auto max-w-[1280px] px-5 py-16 sm:px-8 lg:py-24">
		<div class="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
			<SectionHeading
				eyebrow="The dossier"
				title="Ten areas. One record per program."
				description="Choose a volume, then open the area you need. Every row leads to the evidence index for that area."
			/>

			<div class="inline-flex w-fit items-center border border-rule bg-paper p-1" role="group" aria-label="Choose a program volume">
				{#each programs as program (program.slug)}
					<button
						type="button"
						onclick={() => (activeProgram = program.slug)}
						class="inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium transition-colors"
						class:text-white={activeProgram === program.slug}
						class:text-ink-soft={activeProgram !== program.slug}
						style={activeProgram === program.slug ? `background:${program.accent}` : ''}
						aria-pressed={activeProgram === program.slug}
					>
						<span
							class="size-1.5"
							style:background={activeProgram === program.slug ? '#F8FAF5' : program.accent}
							aria-hidden="true"
						></span>
						{program.code}
					</button>
				{/each}
			</div>
		</div>

		<div class="mt-10 grid gap-10 lg:grid-cols-[1fr_19rem]">
			<AreaTable program={active} />

			<aside class="border border-rule bg-paper p-5 lg:sticky lg:top-24 lg:self-start">
				<p class="font-mono text-[10px] text-ink-soft">Volume {active.code}</p>
				<p class="mt-3 font-display text-[28px] font-semibold leading-none tracking-[-0.04em]">
					{active.code}
				</p>
				<p class="mt-2 text-[12px] leading-relaxed text-ink-soft">{active.name}</p>

				<dl class="mt-5 grid grid-cols-2 gap-4 border-t border-rule pt-4">
					<div>
						<dt class="font-mono text-[9px] text-ink-soft">Level</dt>
						<dd class="mt-1 text-[13px] font-medium">{active.level}</dd>
					</div>
					<div>
						<dt class="font-mono text-[9px] text-ink-soft">Survey</dt>
						<dd class="mt-1 text-[13px] font-medium">{active.surveyYear}</dd>
					</div>
					<div>
						<dt class="font-mono text-[9px] text-ink-soft">Areas</dt>
						<dd class="mt-1 text-[13px] font-medium">{active.areas.length}</dd>
					</div>
					<div>
						<dt class="font-mono text-[9px] text-ink-soft">Linked</dt>
						<dd class="mt-1 text-[13px] font-medium">
							{activeLinked} / {activeTotal}
						</dd>
					</div>
				</dl>

				<a
					href={`/programs/${active.slug}`}
					class="mt-6 inline-flex items-center gap-1.5 border-b border-ink pb-1 text-[11px] font-medium text-ink"
				>
					Open the {active.code} volume
					<ArrowUpRight class="size-3.5" />
				</a>
			</aside>
		</div>
	</div>
</section>

<section class="border-b border-rule bg-paper">
	<div class="mx-auto max-w-[1280px] px-5 py-16 sm:px-8 lg:py-20">
		<div class="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
			<SectionHeading
				eyebrow="Recently linked"
				title="Fresh from the record."
				description="A short ledger of evidence already linked from the 2024 BSFI volume. The BSIE links are being prepared by the task force."
			/>
			<a
				href="/documents"
				class="inline-flex w-fit items-center gap-1.5 border-b border-ink pb-1 text-[11px] font-medium text-ink"
			>
				All documents
				<ArrowUpRight class="size-3.5" />
			</a>
		</div>

		<div class="mt-8 border-t border-rule">
			{#each featured as document (document.id)}
				{@const program = programs.find((item) => item.slug === document.programSlug)}
				<DocumentRow
					{document}
					accent={program?.accent ?? '#082A2C'}
					soft={program?.accentSoft ?? '#E3E9E1'}
					context={`${document.programCode} · Area ${pad2(document.areaNumber ?? 0)} ${document.areaShortTitle ?? ''}`}
				/>
			{/each}
		</div>
	</div>
</section>

<section class="bg-ink text-paper">
	<div class="mx-auto max-w-[1280px] px-5 py-16 sm:px-8 lg:py-24">
		<div class="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
			<div>
				<p class="font-mono text-[10px] text-paper/40">Institutional record</p>
				<h2
					class="mt-4 max-w-md text-balance font-display text-[clamp(2rem,3.6vw,3.2rem)] font-semibold leading-[0.98] tracking-[-0.045em]"
				>
					The documents that sit under both volumes.
				</h2>
				<p class="mt-4 max-w-md text-[14px] leading-relaxed text-paper/60">
					Certification, board action, COPC, and the AACCUP checklist. These are the records an evaluator asks for before the area-by-area reading begins.
				</p>
				<a
					href="/resources"
					class="mt-6 inline-flex items-center gap-1.5 border-b border-paper/50 pb-1 text-[11px] font-medium text-paper"
				>
					Open the institutional record
					<ArrowUpRight class="size-3.5" />
				</a>
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				{#each institutionalDocuments.slice(0, 4) as document (document.id)}
					<InstitutionalCard {document} />
				{/each}
			</div>
		</div>
	</div>
</section>

<section class="bg-salt">
	<div class="mx-auto grid max-w-[1280px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:py-24">
		<div>
			<p class="font-mono text-[10px] text-ink-soft">The visit</p>
			<h2
				class="mt-4 max-w-xl text-balance font-display text-[clamp(2rem,3.8vw,3.4rem)] font-semibold leading-[0.98] tracking-[-0.045em]"
			>
				A Level III visit reads the whole record.
			</h2>
			<p class="mt-5 max-w-xl text-[15px] leading-relaxed text-ink-soft">
				The survey team follows the ten areas, checks the recommendations from the last visit, and looks for evidence that the program has improved since. This site is arranged the way that reading happens: program first, then area, then the file.
			</p>
			<p class="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-soft">
				Both volumes are at Level III for the {site.surveyYear} visit. Where a Drive link is still pending, the row says so plainly so no one mistakes an empty slot for a completed record.
			</p>
		</div>

		<div class="border border-rule bg-paper p-6">
			<p class="font-mono text-[10px] text-ink-soft">Survey card</p>
			<dl class="mt-5 divide-y divide-rule">
				<div class="flex items-center justify-between py-3">
					<dt class="text-[12px] text-ink-soft">Level</dt>
					<dd class="font-display text-sm font-semibold">{site.level}</dd>
				</div>
				<div class="flex items-center justify-between py-3">
					<dt class="text-[12px] text-ink-soft">Programs</dt>
					<dd class="font-display text-sm font-semibold">BSIE · BSFI</dd>
				</div>
				<div class="flex items-center justify-between py-3">
					<dt class="text-[12px] text-ink-soft">Areas</dt>
					<dd class="font-display text-sm font-semibold">10 per program</dd>
				</div>
				<div class="flex items-center justify-between py-3">
					<dt class="text-[12px] text-ink-soft">Survey year</dt>
					<dd class="font-display text-sm font-semibold">{site.surveyYear}</dd>
				</div>
			</dl>
			<a
				href="/about"
				class="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 bg-ink text-[12px] font-medium text-paper transition-colors hover:bg-ink-soft"
			>
				About the visit
				<ArrowUpRight class="size-3.5" />
			</a>
			<p class="mt-4 text-[10px] leading-relaxed text-ink-soft">{site.contactNote}</p>
		</div>
	</div>
</section>
