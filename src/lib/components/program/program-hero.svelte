<script lang="ts">
	import { countLinked, sectionGroups, sectionsOf, visitDocuments } from '#lib/data/accreditation.js';
	import type { Program, Visit } from '#lib/data/types.js';

	let {
		program,
		visit,
		compact = false
	}: {
		program: Program;
		visit: Visit;
		/** Section and search pages get a one-line hero so the documents stay above the fold. */
		compact?: boolean;
	} = $props();

	const documents = $derived(visitDocuments(visit));
	const linked = $derived(countLinked(documents));

	const breakdown = $derived(
		sectionGroups
			.map((group) => {
				const docs = sectionsOf(visit, group.kind).flatMap((section) => section.documents);
				return { label: group.label, linked: countLinked(docs), sections: sectionsOf(visit, group.kind).length };
			})
			.filter((row) => row.sections > 0)
	);
</script>


<section class="border-b border-program/20 bg-program-soft text-ink" aria-label={`${program.code} visit summary`}>
	{#if compact}
		<div class="mx-auto flex max-w-[1280px] flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
			<p class="min-w-0 text-[13px] text-ink-soft">
				<span class="font-medium text-program-ink">{program.name}</span>
				<span class="mx-1.5" aria-hidden="true">·</span>
				<span class="font-mono text-[12px]">{visit.year} {visit.label}</span>
			</p>
			<p class="shrink-0 whitespace-nowrap text-[13px] text-ink-soft">
				<span class="font-mono font-medium text-program-ink">{linked}</span> {linked === 1 ? 'document' : 'documents'} linked
			</p>
		</div>
	{:else}
		<div class="mx-auto grid max-w-[1280px] gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end lg:gap-14 lg:py-14">
			<div class="min-w-0">
				<p class="font-mono text-[12px] text-program-ink">
					AACCUP · {visit.year} · {visit.label}{visit.status === 'archived' ? ' · archived' : ''}
				</p>
				<h1 class="mt-3 font-display text-[clamp(3.75rem,13vw,8.5rem)] font-semibold leading-[0.78] tracking-[-0.075em] text-program">
					{program.code}
				</h1>
				<p class="mt-4 max-w-2xl text-balance font-display text-[clamp(1.25rem,2.6vw,2rem)] font-medium leading-tight tracking-[-0.03em] text-program-ink">
					{program.name}
				</p>
				<p class="mt-4 max-w-2xl text-pretty text-[14px] leading-relaxed text-ink-soft sm:text-[15px]">
					{program.summary}
				</p>
			</div>

			<div class="border-t-2 border-program pt-4">
				<p class="font-mono text-[12px] text-ink-soft">Documents linked</p>
				<p class="mt-1 font-display text-[44px] font-semibold leading-none tracking-[-0.05em] text-program-ink">
					{linked}
				</p>
				<dl class="mt-4 space-y-1.5 text-[13px]">
					{#each breakdown as row (row.label)}
						<div class="flex items-baseline justify-between gap-3 border-b border-program/15 pb-1.5">
							<dt class="text-ink-soft">{row.label}</dt>
							<dd class="font-mono text-[12px] text-program-ink">{row.linked}</dd>
						</div>
					{/each}
				</dl>
			</div>
		</div>
	{/if}
</section>
