<script lang="ts">
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import AreaTable from '$lib/components/site/area-table.svelte';
	import DocumentRow from '$lib/components/site/document-row.svelte';
	import SectionHeading from '$lib/components/site/section-heading.svelte';
	import { countLinked } from '$lib/data/accreditation';
	import { pad2 } from '$lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const program = $derived(data.program);
	const currentLinked = $derived(
		program.currentVisitAreas.flatMap((area) => area.documents).filter((document) => document.status === 'linked').length
	);
	const currentTotal = $derived(program.currentVisitAreas.flatMap((area) => area.documents).length);
	const previousLinked = $derived(
		[...program.areas.flatMap((area) => area.documents), ...program.programDocuments].filter(
			(document) => document.status === 'linked'
		).length
	);
	const previousTotal = $derived(
		[...program.areas.flatMap((area) => area.documents), ...program.programDocuments].length
	);
</script>

<svelte:head>
	<title>{program.code} · {program.level} · AACCUP 2026</title>
	<meta
		name="description"
		content={`${program.name} at CTU Moalboal — ${program.level} dossier. Current visit areas, previous-visit recommendations, and shared records.`}
	/>
</svelte:head>

<section
	class="border-b border-rule"
	style:background={program.accentSoft}
	style:--program-accent={program.accent}
>
	<div class="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 lg:py-16">
		<a href="/" class="text-[11px] font-medium text-ink-soft transition-colors hover:text-ink">
			← All volumes
		</a>

		<div class="mt-9 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
			<div>
				<div class="flex items-center gap-2.5 font-mono text-[10px] text-ink-soft">
					<span class="size-2" style:background={program.accent} aria-hidden="true"></span>
					<span>{program.code} · {program.level} · {program.surveyYear}</span>
				</div>

				<h1
					class="mt-3 font-display text-[clamp(4rem,11vw,8rem)] font-semibold leading-[0.75] tracking-[-0.07em]"
					style:color={program.accent}
				>
					{program.code}
				</h1>

				<p class="mt-3 max-w-2xl text-balance font-display text-[clamp(1.25rem,2.4vw,2rem)] font-medium leading-tight tracking-[-0.03em] text-ink">
					{program.name}
				</p>
				<p class="mt-2 text-[11px] text-ink-soft">{program.statusNote}</p>
			</div>

			<dl class="grid grid-cols-2 gap-x-8 gap-y-4 border-t border-ink/15 pt-4 lg:min-w-[22rem]">
				<div>
					<dt class="font-mono text-[9px] text-ink-soft">Visit</dt>
					<dd class="mt-1 font-display text-[15px] font-semibold">{program.level}</dd>
				</div>
				<div>
					<dt class="font-mono text-[9px] text-ink-soft">Year</dt>
					<dd class="mt-1 font-display text-[15px] font-semibold">{program.surveyYear}</dd>
				</div>
				<div>
					<dt class="font-mono text-[9px] text-ink-soft">Current visit</dt>
					<dd class="mt-1 font-display text-[15px] font-semibold">{program.currentVisitAreas.length} areas</dd>
				</div>
				<div>
					<dt class="font-mono text-[9px] text-ink-soft">Previous visit</dt>
					<dd class="mt-1 font-display text-[15px] font-semibold">10 areas</dd>
				</div>
			</dl>
		</div>
	</div>
</section>

<section id="current" class="scroll-mt-20 border-b border-rule bg-salt">
	<div class="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 lg:py-16">
		<div class="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
			<SectionHeading
				eyebrow="Current visit"
				title="Four areas under review."
				description={`The ${program.surveyYear} visit focuses on the areas below. Start here if you are reading the current evidence.`}
			/>
			<p class="font-mono text-[10px] text-ink-soft">
				{currentLinked} / {currentTotal} linked
			</p>
		</div>

		{#if currentLinked === 0}
			<div class="mt-6 border border-dashed border-ink/25 bg-paper p-4 text-[12px] leading-relaxed text-ink-soft">
				The current-visit evidence is still being assembled. Each area page is in place; the task force will link the files before the visit.
			</div>
		{/if}

		<div class="mt-8 grid border-t border-ink/20 sm:grid-cols-2">
			{#each program.currentVisitAreas as area (area.slug)}
				{@const linked = countLinked(area.documents)}
				{@const pending = area.documents.length - linked}
				<a
					href={`/${program.slug}/visit/${area.slug}`}
					class="group border-b border-rule px-1 py-5 transition-colors hover:bg-[var(--program-accent-soft)] sm:px-4 sm:odd:border-r"
					style:--program-accent-soft={program.accentSoft}
				>
					<div class="flex items-start justify-between gap-4">
						<span class="font-mono text-[10px] text-ink-soft">{pad2(area.number)}</span>
						<ArrowUpRight class="size-4 text-ink-soft transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
					</div>
					<h3 class="mt-4 font-display text-[22px] font-semibold tracking-[-0.03em] text-ink">
						{area.title}
					</h3>
					<p class="mt-2 max-w-md text-[12px] leading-relaxed text-ink-soft">{area.description}</p>
					<p class="mt-4 font-mono text-[9px] text-ink-soft">
						{linked} linked · {pending} in preparation
					</p>
				</a>
			{/each}
		</div>
	</div>
</section>

<section id="previous" class="scroll-mt-20 border-b border-rule bg-paper">
	<div class="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 lg:py-16">
		<div class="grid gap-8 lg:grid-cols-[1fr_18rem]">
			<div>
				<SectionHeading
					eyebrow="Previous visit"
					title="The 10-area recommendations record."
					description={`These pages hold the compliance record from the ${program.previousVisitLabel ? program.previousVisitLabel.toLowerCase() : 'previous visit'}, not the current visit evidence.`}
				/>
				<p class="mt-4 max-w-2xl border-l-2 border-ink/20 pl-4 text-[12px] leading-relaxed text-ink-soft">
					An accreditor checking a previous recommendation should use this index. An accreditor checking the current visit should start with the four areas above.
				</p>

				<div class="mt-8">
					<AreaTable {program} />
				</div>
			</div>

			<aside class="lg:sticky lg:top-24 lg:self-start">
				<div class="border border-rule bg-salt p-5">
					<p class="font-mono text-[9px] text-ink-soft">Previous visit</p>
					<p class="mt-2 font-display text-[22px] font-semibold tracking-[-0.03em]">{program.previousVisitLabel || 'Previous survey'}</p>
					<p class="mt-2 text-[11px] leading-relaxed text-ink-soft">
						{previousLinked} of {previousTotal} records are linked.
					</p>
					<a
						href={`/${program.slug}/documents`}
						class="mt-4 inline-flex items-center gap-1.5 border-b border-ink pb-1 text-[10px] font-medium text-ink"
					>
						Search this volume
						<ArrowUpRight class="size-3.5" />
					</a>
				</div>
				<div class="mt-4 border border-rule bg-salt p-5">
					<p class="font-mono text-[9px] text-ink-soft">Shared record</p>
					<p class="mt-2 text-[11px] leading-relaxed text-ink-soft">
						Certification, BOR resolution, COPC, and the checklist are shared by both volumes.
					</p>
					<a
						href={`/${program.slug}/records`}
						class="mt-4 inline-flex items-center gap-1.5 border-b border-ink pb-1 text-[10px] font-medium text-ink"
					>
						Open records
						<ArrowUpRight class="size-3.5" />
					</a>
				</div>
			</aside>
		</div>
	</div>
</section>

<section class="border-b border-rule bg-salt">
	<div class="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 lg:py-16">
		<SectionHeading
			eyebrow="Previous visit — additional evidence"
			title="Program-wide records outside the 10 areas."
			description="Extension, library, linkages, and the checklist, carried forward from the previous visit."
		/>
		<div class="mt-6 border-t border-rule">
			{#each program.programDocuments as document (document.id)}
				<DocumentRow
					{document}
					accent={program.accent}
					soft={program.accentSoft}
					context={`${program.code} · Previous visit · Program-wide`}
				/>
			{/each}
		</div>
	</div>
</section>
