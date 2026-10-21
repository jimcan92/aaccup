<script lang="ts">
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import { programs } from '$lib/data/accreditation';
	import { site } from '$lib/data/site';

	const milestones = [
		{
			year: '1947',
			title: 'The school begins',
			body: 'Moalboal Provincial High School opens under a municipal council resolution, in a makeshift building on a 4,384-square-metre site.'
		},
		{
			year: '1963',
			title: 'A fisheries school',
			body: 'Republic Act No. 3613 converts the high school into the Moalboal Southern Cebu School of Fisheries.'
		},
		{
			year: '1983',
			title: 'A college campus',
			body: 'Batas Pambansa Blg. 412 makes the school a satellite campus of the Cebu State College of Science and Technology.'
		},
		{
			year: '2009',
			title: 'Cebu Technological University',
			body: 'Republic Act No. 9744 converts the system into Cebu Technological University.'
		},
		{
			year: '2011',
			title: 'First AACCUP survey',
			body: 'AACCUP undertakes its first accreditation survey at Moalboal, covering education, industrial technology, industrial engineering, and hospitality management.'
		},
		{
			year: '2026',
			title: 'Level III visits',
			body: 'BSIE and BSFI prepare for their Level III accreditation visits, with the evidence organised in this dossier.'
		}
	];
</script>

<svelte:head>
	<title>About the visit · AACCUP Level III · CTU Moalboal</title>
	<meta
		name="description"
		content="What the AACCUP Level III visit means, how the CTU Moalboal dossier is organised, and how to access the evidence in Google Drive."
	/>
</svelte:head>

<section class="relative overflow-hidden bg-ink text-paper">
	<div class="mx-auto max-w-[1280px] px-5 py-16 sm:px-8 lg:py-24">
		<div class="flex items-center gap-3 font-mono text-[10px] text-paper/50">
			<span class="h-px w-6 bg-paper/30" aria-hidden="true"></span>
			<span>About the visit</span>
		</div>
		<h1
			class="mt-5 max-w-4xl text-balance font-display text-[clamp(3rem,7vw,6rem)] font-semibold leading-[0.88] tracking-[-0.06em]"
		>
			A record read closely.
		</h1>
		<p class="mt-6 max-w-2xl text-[15px] leading-relaxed text-paper/60">
			The AACCUP Level III visit is not a single presentation. It is a close reading of ten areas, the recommendations from the previous survey, and the evidence that the program has changed since.
		</p>
	</div>
</section>

<section class="border-b border-rule bg-salt">
	<div class="mx-auto grid max-w-[1280px] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_1fr] lg:gap-20 lg:py-20">
		<div>
			<p class="font-mono text-[10px] text-ink-soft">The standard</p>
			<h2 class="mt-4 max-w-lg text-balance font-display text-[clamp(2rem,3.6vw,3.2rem)] font-semibold leading-[0.98] tracking-[-0.045em]">
				What Level III asks for.
			</h2>
		</div>
		<div class="space-y-4 text-[14px] leading-relaxed text-ink-soft">
			<p>
				Level III accreditation looks for a program that is not only compliant, but deliberate: a clear mission, a qualified faculty, a curriculum that is reviewed and renewed, and evidence that students are supported from admission to outcome.
			</p>
			<p>
				It also asks whether the program knows its own record. Recommendations from the last visit should be answered with evidence, not assertion. Research and extension should be visible in the life of the campus. Facilities and laboratories should match the work the curriculum claims.
			</p>
			<p>
				This dossier is arranged around those questions. Each area page holds the recommendations, the compliance report, and the supporting evidence, in the order an evaluator is likely to read them.
			</p>
		</div>
	</div>
</section>

<section class="border-b border-rule bg-paper">
	<div class="mx-auto max-w-[1280px] px-5 py-14 sm:px-8 lg:py-20">
		<div class="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
			<div>
				<p class="font-mono text-[10px] text-ink-soft">Two volumes</p>
				<h2 class="mt-4 max-w-lg text-balance font-display text-[clamp(2rem,3.6vw,3.2rem)] font-semibold leading-[0.98] tracking-[-0.045em]">
					One campus record, two program records.
				</h2>
				<p class="mt-4 max-w-md text-[14px] leading-relaxed text-ink-soft">
					The BSIE and BSFI volumes share the institutional record but keep their area evidence separate. The colour on each volume is a navigation cue, not a ranking.
				</p>
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				{#each programs as program (program.slug)}
					<a
						href={`/programs/${program.slug}`}
						class="group relative flex min-h-[220px] flex-col justify-between border border-rule bg-salt p-5 transition-colors hover:bg-white"
						style:border-left-color={program.accent}
					>
						<span class="absolute inset-y-0 left-0 w-1.5" style:background={program.accent} aria-hidden="true"></span>
						<span class="font-mono text-[10px] text-ink-soft">{program.level}</span>
						<span class="mt-8">
							<span class="block font-display text-[42px] font-semibold leading-none tracking-[-0.06em]" style:color={program.accent}>
								{program.code}
							</span>
							<span class="mt-3 block text-[12px] leading-snug text-ink-soft">{program.name}</span>
						</span>
						<span class="mt-6 flex items-center justify-between border-t border-rule pt-3 text-[10px] font-medium text-ink-soft">
							Open volume
							<ArrowUpRight class="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
						</span>
					</a>
				{/each}
			</div>
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
				The site stores the index, not the files. Before the visit, every Google Drive file and folder linked here must be shared as <strong class="font-medium text-paper">Anyone with the link — Viewer</strong>.
			</p>
			<p>
				A link that works for the task force but not for an external evaluator is the most common failure in a digital dossier. Check each link from a signed-out browser, not only from your own account.
			</p>
			<p>{site.contactNote}</p>
		</div>
	</div>
</section>

<section class="border-b border-rule bg-salt">
	<div class="mx-auto max-w-[1280px] px-5 py-14 sm:px-8 lg:py-20">
		<div class="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
			<div>
				<p class="font-mono text-[10px] text-ink-soft">The campus</p>
				<h2 class="mt-4 max-w-md text-balance font-display text-[clamp(2rem,3.6vw,3.2rem)] font-semibold leading-[0.98] tracking-[-0.045em]">
					From a fisheries school to a university campus.
				</h2>
				<p class="mt-4 max-w-md text-[14px] leading-relaxed text-ink-soft">
					Moalboal is the campus’s founding discipline and its constant thread. The timeline below is the short version; the full campus history sits in the university record.
				</p>
			</div>

			<ol class="relative border-l border-ink/15">
				{#each milestones as milestone (milestone.year)}
					<li class="relative pb-8 pl-6 last:pb-0">
						<span class="absolute -left-[3px] top-1.5 size-1.5 bg-ink" aria-hidden="true"></span>
						<div class="flex items-baseline gap-3">
							<span class="font-mono text-[11px] font-medium text-ink">{milestone.year}</span>
							<span class="font-display text-[15px] font-semibold tracking-[-0.02em] text-ink">{milestone.title}</span>
						</div>
						<p class="mt-1.5 max-w-lg text-[12px] leading-relaxed text-ink-soft">{milestone.body}</p>
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
