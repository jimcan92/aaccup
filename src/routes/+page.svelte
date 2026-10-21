<script lang="ts">
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import CampusCarousel from '$lib/components/site/campus-carousel.svelte';
	import HeroMap from '$lib/components/site/hero-map.svelte';
	import InstitutionalCard from '$lib/components/site/institutional-card.svelte';
	import ProgramSpines from '$lib/components/site/program-spines.svelte';
	import SectionHeading from '$lib/components/site/section-heading.svelte';
	import { institutionalDocuments, programs } from '$lib/data/accreditation';
	import { site, vmgo } from '$lib/data/site';

	const steps = [
		{
			number: '01',
			title: 'Choose a volume',
			body: 'Open BSIE or BSFI. The selector stays with you, and every page after that belongs to that program.'
		},
		{
			number: '02',
			title: 'Start with the current visit',
			body: 'Four areas are under review in 2026: Faculty Development, Instruction, Extension, and Linkages. These are the first links in each volume.'
		},
		{
			number: '03',
			title: 'Then read the previous visit',
			body: 'The 10 AACCUP areas hold the last survey’s recommendations and compliance reports. They are the archive, not the current evidence.'
		}
	];

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'EducationalOrganization',
		name: site.campus,
		alternateName: 'CTU Moalboal',
		description: site.description,
		address: {
			'@type': 'PostalAddress',
			addressLocality: 'Moalboal',
			addressRegion: 'Cebu',
			postalCode: '6032',
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

<section id="volumes" class="relative scroll-mt-20 overflow-hidden bg-ink text-paper">
	<div class="pointer-events-none absolute inset-0 text-foam opacity-[0.11]" aria-hidden="true">
		<HeroMap />
	</div>

	<div
		class="relative mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-14 px-5 pb-16 pt-14 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-10 lg:pb-24 lg:pt-20"
	>
		<div class="min-w-0 max-w-[44rem]">
			<div class="flex items-center gap-3 font-mono text-[10px] text-paper/55">
				<span class="h-px w-8 bg-paper/30" aria-hidden="true"></span>
				<span>AACCUP Level III visit · {site.surveyYear}</span>
			</div>

			<h1
				class="mt-6 text-balance font-display text-[clamp(3rem,5.6vw,5.1rem)] font-semibold leading-[0.92] tracking-[-0.06em]"
			>
				Two volumes.<br />One campus.
			</h1>

			<p class="mt-6 max-w-xl text-pretty text-[15px] leading-relaxed text-paper/65 sm:text-base">
				{site.intro}
			</p>

			<div class="mt-8 flex flex-col gap-3 sm:flex-row">
				<a
					href="#visit"
					class="inline-flex h-11 items-center justify-center gap-2 bg-paper px-5 text-[13px] font-medium text-ink transition-colors hover:bg-white"
				>
					How the dossier works
					<ArrowDown class="size-4" />
				</a>
				<a
					href="#vmgo"
					class="inline-flex h-11 items-center justify-center border border-paper/25 px-5 text-[13px] font-medium text-paper transition-colors hover:bg-paper/10"
				>
					Read the VMGO
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

<CampusCarousel />

<section id="visit" class="scroll-mt-20 border-b border-rule bg-salt">
	<div class="mx-auto max-w-[1280px] px-5 py-16 sm:px-8 lg:py-24">
		<div class="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
			<div>
				<SectionHeading
					eyebrow="How the dossier works"
					title="Current visit. Previous visit. Shared record."
					description="Each program is read on its own terms. The current visit comes first; the last visit’s recommendations sit behind it; the institutional record is shared."
				/>
				<p class="mt-6 max-w-md text-[13px] leading-relaxed text-ink-soft">
					An accreditor can move from the four current areas to the 10-area archive without leaving the program. The program selector is the only shared control.
				</p>
			</div>

			<ol class="border-t border-ink/20">
				{#each steps as step (step.number)}
					<li class="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-rule py-5 sm:grid-cols-[3rem_1fr]">
						<span class="font-mono text-[11px] text-ink-soft">{step.number}</span>
						<div>
							<h3 class="font-display text-[18px] font-semibold tracking-[-0.025em] text-ink">{step.title}</h3>
							<p class="mt-1.5 max-w-xl text-[12px] leading-relaxed text-ink-soft">{step.body}</p>
						</div>
					</li>
				{/each}
			</ol>
		</div>
	</div>
</section>

<section id="vmgo" class="scroll-mt-20 border-b border-rule bg-paper">
	<div class="mx-auto max-w-[1280px] px-5 py-16 sm:px-8 lg:py-24">
		<div class="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
			<div>
				<p class="font-mono text-[9px] text-ink-soft">The university</p>
				<h2
					class="mt-4 max-w-2xl text-balance font-display text-[clamp(2rem,4vw,3.4rem)] font-semibold leading-[0.98] tracking-[-0.045em]"
				>
					“{vmgo.vision}”
				</h2>
				<p class="mt-4 font-mono text-[9px] text-ink-soft">University vision</p>
			</div>

			<div class="lg:pt-10">
				<p class="font-mono text-[9px] text-ink-soft">University mission</p>
				<p class="mt-4 text-[14px] leading-relaxed text-ink-soft">{vmgo.mission}</p>
				<a
					href={vmgo.source}
					target="_blank"
					rel="noopener noreferrer"
					class="mt-6 inline-flex items-center gap-1.5 border-b border-ink pb-1 text-[10px] font-medium text-ink"
				>
					{vmgo.sourceLabel}
					<ArrowUpRight class="size-3.5" />
				</a>
			</div>
		</div>
	</div>
</section>

<section id="records" class="scroll-mt-20 bg-ink text-paper">
	<div class="mx-auto max-w-[1280px] px-5 py-16 sm:px-8 lg:py-24">
		<div class="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
			<div>
				<p class="font-mono text-[9px] text-paper/40">Shared record</p>
				<h2
					class="mt-4 max-w-md text-balance font-display text-[clamp(2rem,3.6vw,3.2rem)] font-semibold leading-[0.98] tracking-[-0.045em]"
				>
					One set of records under both volumes.
				</h2>
				<p class="mt-4 max-w-md text-[13px] leading-relaxed text-paper/60">
					Certification, board action, COPC, and the AACCUP checklist. The URL stays inside each program, but the source is the same.
				</p>
				<a
					href="/bsie/records"
					class="mt-6 inline-flex items-center gap-1.5 border-b border-paper/50 pb-1 text-[10px] font-medium text-paper"
				>
					Open the BSIE record
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

<section id="campus" class="scroll-mt-20 bg-salt">
	<div class="mx-auto grid max-w-[1280px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:py-24">
		<div>
			<p class="font-mono text-[9px] text-ink-soft">The campus</p>
			<h2
				class="mt-4 max-w-xl text-balance font-display text-[clamp(2rem,3.8vw,3.4rem)] font-semibold leading-[0.98] tracking-[-0.045em]"
			>
				A campus since 1947.
			</h2>
			<p class="mt-5 max-w-xl text-[14px] leading-relaxed text-ink-soft">
				Moalboal began as a municipal high school, became a fisheries school, then a college campus, and in 2009 a campus of Cebu Technological University. Fisheries remains its founding discipline; engineering and technology sit beside it.
			</p>
			<div class="mt-7 grid gap-4 sm:grid-cols-3">
				<div class="border-t border-ink/20 pt-3">
					<p class="font-mono text-[10px] text-ink">1947</p>
					<p class="mt-1 text-[11px] leading-snug text-ink-soft">Moalboal Provincial High School</p>
				</div>
				<div class="border-t border-ink/20 pt-3">
					<p class="font-mono text-[10px] text-ink">2009</p>
					<p class="mt-1 text-[11px] leading-snug text-ink-soft">Cebu Technological University</p>
				</div>
				<div class="border-t border-ink/20 pt-3">
					<p class="font-mono text-[10px] text-ink">2026</p>
					<p class="mt-1 text-[11px] leading-snug text-ink-soft">BSIE and BSFI Level III visits</p>
				</div>
			</div>
		</div>

		<div class="border border-rule bg-paper p-6">
			<p class="font-mono text-[9px] text-ink-soft">Campus contact</p>
			<p class="mt-4 text-[13px] leading-relaxed text-ink">
				{site.address}<br />
				<a href={`tel:${site.phone.replace(/[^+\d]/g, '')}`} class="text-ink-soft hover:text-ink">{site.phone}</a><br />
				<a href={`mailto:${site.email}`} class="text-ink-soft hover:text-ink">{site.email}</a>
			</p>
			<a
				href={site.website}
				target="_blank"
				rel="noopener noreferrer"
				class="mt-5 inline-flex items-center gap-1.5 border-b border-ink pb-1 text-[10px] font-medium text-ink"
			>
				Official campus website
				<ArrowUpRight class="size-3.5" />
			</a>
			<p class="mt-5 text-[10px] leading-relaxed text-ink-soft">{site.contactNote}</p>
		</div>
	</div>
</section>
