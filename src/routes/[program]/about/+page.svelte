<script lang="ts">
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import { site, vmgo } from '$lib/data/site';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const program = $derived(data.program);

	const milestones = [
		{ year: '1947', title: 'The school begins', body: 'Moalboal Provincial High School opens under a municipal council resolution.' },
		{ year: '1963', title: 'A fisheries school', body: 'Republic Act No. 3613 converts the high school into the Moalboal Southern Cebu School of Fisheries.' },
		{ year: '1983', title: 'A college campus', body: 'Batas Pambansa Blg. 412 makes the school a satellite campus of the CSCST system.' },
		{ year: '2009', title: 'Cebu Technological University', body: 'Republic Act No. 9744 converts the system into Cebu Technological University.' },
		{ year: '2011', title: 'First AACCUP survey', body: 'AACCUP undertakes its first accreditation survey at Moalboal.' },
		{ year: '2026', title: 'Level III visits', body: 'BSIE and BSFI prepare for their Level III visits.' }
	];
</script>

<svelte:head>
	<title>About the visit · {program.code} · AACCUP 2026</title>
	<meta name="description" content={`About the ${program.code} Level III visit at CTU Moalboal, and how this volume is organised.`} />
</svelte:head>

<section class="bg-ink text-paper">
	<div class="mx-auto max-w-[1280px] px-5 py-16 sm:px-8 lg:py-24">
		<div class="flex items-center gap-3 font-mono text-[10px] text-paper/50">
			<span class="h-px w-6 bg-paper/30" aria-hidden="true"></span>
			<span>{program.code} · About the visit</span>
		</div>
		<h1 class="mt-5 max-w-4xl text-balance font-display text-[clamp(3rem,7vw,6rem)] font-semibold leading-[0.88] tracking-[-0.06em]">
			A record read closely.
		</h1>
		<p class="mt-6 max-w-2xl text-[15px] leading-relaxed text-paper/60">
			The {program.surveyYear} visit is the Level III application for {program.code}. It reads the four current areas first, then the 10-area recommendations from the previous survey.
		</p>
	</div>
</section>

<section class="border-b border-rule bg-salt">
	<div class="mx-auto grid max-w-[1280px] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_1fr] lg:gap-20 lg:py-20">
		<div>
			<p class="font-mono text-[9px] text-ink-soft">The standard</p>
			<h2 class="mt-4 max-w-lg text-balance font-display text-[clamp(2rem,3.6vw,3.2rem)] font-semibold leading-[0.98] tracking-[-0.045em]">
				What Level III asks for.
			</h2>
		</div>
		<div class="space-y-4 text-[14px] leading-relaxed text-ink-soft">
			<p>
				Level III looks for a program that is not only compliant, but deliberate: a clear mission, a qualified faculty, a curriculum that is reviewed and renewed, and evidence that students are supported from admission to outcome.
			</p>
			<p>
				It also asks whether the program knows its own record. Recommendations from the last visit should be answered with evidence, not assertion. Research and extension should be visible in the life of the campus.
			</p>
			<p class="border-l-2 border-ink/20 pl-4 text-[12px]">
				The campus currently holds Level II for {program.code}. This visit is the Level III application. The official status page is the source of record.
			</p>
			<a
				href="https://www.ctu.edu.ph/moalboal/aaccup-2/"
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-1.5 border-b border-ink pb-1 text-[10px] font-medium text-ink"
			>
				Official AACCUP status page
				<ArrowUpRight class="size-3.5" />
			</a>
		</div>
	</div>
</section>

<section class="border-b border-rule bg-paper">
	<div class="mx-auto max-w-[1280px] px-5 py-14 sm:px-8 lg:py-20">
		<div class="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-20">
			<div>
				<p class="font-mono text-[9px] text-ink-soft">How this volume works</p>
				<h2 class="mt-4 max-w-lg text-balance font-display text-[clamp(2rem,3.6vw,3.2rem)] font-semibold leading-[0.98] tracking-[-0.045em]">
					Current visit, previous visit, shared record.
				</h2>
				<p class="mt-4 max-w-md text-[14px] leading-relaxed text-ink-soft">
					The current visit is the four areas under review in {program.surveyYear}. The previous visit is the 10-area recommendations record. The shared record is certification, BOR, COPC, and the checklist.
				</p>
			</div>

			<ol class="border-t border-ink/20">
				<li class="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-rule py-4">
					<span class="font-mono text-[10px] text-ink-soft">01</span>
					<div>
						<p class="font-display text-[16px] font-semibold tracking-[-0.02em]">Current visit</p>
						<p class="mt-1 text-[11px] leading-relaxed text-ink-soft">The four areas under review now. Start here.</p>
					</div>
				</li>
				<li class="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-rule py-4">
					<span class="font-mono text-[10px] text-ink-soft">02</span>
					<div>
						<p class="font-display text-[16px] font-semibold tracking-[-0.02em]">Previous visit</p>
						<p class="mt-1 text-[11px] leading-relaxed text-ink-soft">The 10-area recommendations and compliance record.</p>
					</div>
				</li>
				<li class="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-rule py-4">
					<span class="font-mono text-[10px] text-ink-soft">03</span>
					<div>
						<p class="font-display text-[16px] font-semibold tracking-[-0.02em]">Shared record</p>
						<p class="mt-1 text-[11px] leading-relaxed text-ink-soft">Certification, BOR, COPC, and the checklist.</p>
					</div>
				</li>
			</ol>
		</div>
	</div>
</section>

<section class="bg-ink text-paper">
	<div class="mx-auto grid max-w-[1280px] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:py-20">
		<div>
			<p class="font-mono text-[10px] text-paper/40">Access</p>
			<h2 class="mt-4 max-w-md text-balance font-display text-[clamp(2rem,3.6vw,3.2rem)] font-semibold leading-[0.98] tracking-[-0.045em]">
				Every file must open for the evaluator.
			</h2>
		</div>
		<div class="space-y-4 text-[14px] leading-relaxed text-paper/60">
			<p>
				The site stores the index, not the files. Every Google Drive file and folder linked here must be shared as
				<strong class="font-medium text-paper"> Anyone with the link — Viewer</strong>.
			</p>
			<p>Test each link from a signed-out browser, not only from your own account.</p>
			<p>{site.contactNote}</p>
			<a
				href={vmgo.source}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-1.5 border-b border-paper/40 pb-1 text-[10px] font-medium text-paper"
			>
				Official CTU Moalboal VMGO
				<ArrowUpRight class="size-3.5" />
			</a>
		</div>
	</div>
</section>

<section class="border-b border-rule bg-salt">
	<div class="mx-auto max-w-[1280px] px-5 py-14 sm:px-8 lg:py-20">
		<div class="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
			<div>
				<p class="font-mono text-[9px] text-ink-soft">The campus</p>
				<h2 class="mt-4 max-w-md text-balance font-display text-[clamp(2rem,3.6vw,3.2rem)] font-semibold leading-[0.98] tracking-[-0.045em]">
					From a fisheries school to a university campus.
				</h2>
				<p class="mt-4 max-w-md text-[14px] leading-relaxed text-ink-soft">
					Moalboal is the campus’s founding discipline and its constant thread. The timeline is the short version.
				</p>
			</div>

			<ol class="relative border-l border-ink/15">
				{#each milestones as milestone (milestone.year)}
					<li class="relative pb-7 pl-6 last:pb-0">
						<span class="absolute -left-[3px] top-1.5 size-1.5 bg-ink" aria-hidden="true"></span>
						<div class="flex items-baseline gap-3">
							<span class="font-mono text-[11px] font-medium text-ink">{milestone.year}</span>
							<span class="font-display text-[14px] font-semibold tracking-[-0.02em] text-ink">{milestone.title}</span>
						</div>
						<p class="mt-1.5 max-w-lg text-[11px] leading-relaxed text-ink-soft">{milestone.body}</p>
					</li>
				{/each}
			</ol>
		</div>
	</div>
</section>

<section class="bg-paper">
	<div class="mx-auto flex max-w-[1280px] flex-col gap-3 px-5 py-10 text-[10px] text-ink-soft sm:flex-row sm:items-center sm:justify-between sm:px-8">
		<p>Prepared by the {site.preparedBy} for the Campus AACCUP Task Force.</p>
		<p class="max-w-xl sm:text-right">{site.driveNote}</p>
	</div>
</section>
