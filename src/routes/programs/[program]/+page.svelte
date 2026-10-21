<script lang="ts">
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import AreaTable from '$lib/components/site/area-table.svelte';
	import DocumentRow from '$lib/components/site/document-row.svelte';
	import ProgramSwitch from '$lib/components/site/program-switch.svelte';
	import SectionHeading from '$lib/components/site/section-heading.svelte';
	import { countLinked } from '$lib/data/accreditation';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const program = $derived(data.program);
	const linked = $derived(
		[...program.areas.flatMap((area) => area.documents), ...program.programDocuments].filter(
			(document) => document.status === 'linked'
		).length
	);
	const total = $derived(
		[...program.areas.flatMap((area) => area.documents), ...program.programDocuments].length
	);
</script>

<svelte:head>
	<title>{program.code} · {program.name} · AACCUP Level III</title>
	<meta
		name="description"
		content={`${program.name} at CTU Moalboal — ${program.level} AACCUP dossier, organised into ten areas with links to the source evidence in Google Drive.`}
	/>
</svelte:head>

<section
	class="border-b border-rule"
	style:background={program.accentSoft}
	style:--program-accent={program.accent}
	style:--program-ink={program.accentInk}
>
	<div class="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 lg:py-16">
		<div class="flex items-center justify-between gap-4">
			<a href="/" class="text-[11px] font-medium text-ink-soft transition-colors hover:text-ink">
				← All volumes
			</a>
			<ProgramSwitch active={program.slug} />
		</div>

		<div class="mt-9 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
			<div>
				<div class="flex items-center gap-2.5 font-mono text-[10px] text-ink-soft">
					<span class="size-2" style:background={program.accent} aria-hidden="true"></span>
					<span>Volume {program.code} · {program.level}</span>
				</div>

				<h1
					class="mt-3 font-display text-[clamp(4rem,11vw,8rem)] font-semibold leading-[0.75] tracking-[-0.07em]"
					style:color={program.accent}
				>
					{program.code}
				</h1>

				<p
					class="mt-3 max-w-2xl text-balance font-display text-[clamp(1.25rem,2.4vw,2rem)] font-medium leading-tight tracking-[-0.03em] text-ink"
				>
					{program.name}
				</p>
			</div>

			<dl class="grid grid-cols-2 gap-x-8 gap-y-4 border-t border-ink/15 pt-4 lg:min-w-[21rem]">
				<div>
					<dt class="font-mono text-[9px] text-ink-soft">Accreditation</dt>
					<dd class="mt-1 font-display text-[15px] font-semibold">{program.level}</dd>
				</div>
				<div>
					<dt class="font-mono text-[9px] text-ink-soft">Survey</dt>
					<dd class="mt-1 font-display text-[15px] font-semibold">{program.surveyWindow}</dd>
				</div>
				<div>
					<dt class="font-mono text-[9px] text-ink-soft">Areas</dt>
					<dd class="mt-1 font-display text-[15px] font-semibold">{program.areas.length}</dd>
				</div>
				<div>
					<dt class="font-mono text-[9px] text-ink-soft">Evidence linked</dt>
					<dd class="mt-1 font-display text-[15px] font-semibold">{linked} / {total}</dd>
				</div>
			</dl>
		</div>
	</div>
</section>

<section class="bg-salt">
	<div class="mx-auto grid max-w-[1280px] gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_19rem] lg:py-16">
		<div>
			<SectionHeading
				eyebrow="Program summary"
				title={program.summaryTitle}
				description={program.summary}
			/>

			{#if linked === 0}
				<div class="mt-8 border border-dashed border-ink/25 bg-paper p-4 text-[12px] leading-relaxed text-ink-soft">
					The Drive links for this volume are still being assembled. The area structure is in place; each area will show its linked evidence as soon as the task force supplies the URLs.
				</div>
			{/if}

			<div class="mt-8">
				<AreaTable {program} />
			</div>
		</div>

		<aside class="lg:sticky lg:top-24 lg:self-start">
			<div class="border border-rule bg-paper p-5">
				<p class="font-mono text-[10px] text-ink-soft">How to read this volume</p>
				<ol class="mt-4 space-y-4">
					<li class="flex gap-3">
						<span class="font-mono text-[10px] text-ink-soft">01</span>
						<p class="text-[12px] leading-relaxed text-ink-soft">
							Start with the area that matches the evaluator’s assignment.
						</p>
					</li>
					<li class="flex gap-3">
						<span class="font-mono text-[10px] text-ink-soft">02</span>
						<p class="text-[12px] leading-relaxed text-ink-soft">
							Open the recommendation and compliance files first; they frame the evidence.
						</p>
					</li>
					<li class="flex gap-3">
						<span class="font-mono text-[10px] text-ink-soft">03</span>
						<p class="text-[12px] leading-relaxed text-ink-soft">
							Every linked row opens the source file in Google Drive in a new tab.
						</p>
					</li>
				</ol>
			</div>

			<div class="mt-4 border border-rule bg-paper p-5">
				<p class="font-mono text-[10px] text-ink-soft">Survey note</p>
				<p class="mt-2 text-[12px] leading-relaxed text-ink-soft">
					The exact visit schedule is confirmed by AACCUP. This site will carry the final dates once they are issued.
				</p>
				<a
					href="/about"
					class="mt-4 inline-flex items-center gap-1.5 border-b border-ink pb-1 text-[10px] font-medium text-ink"
				>
					About the visit
					<ArrowUpRight class="size-3.5" />
				</a>
			</div>
		</aside>
	</div>
</section>

<section class="border-t border-rule bg-paper">
	<div class="mx-auto max-w-[1280px] px-5 py-14 sm:px-8 lg:py-20">
		<div class="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
			<SectionHeading
				eyebrow="Program-wide evidence"
				title="Not tied to a single area."
				description="Supporting records that the evaluator may ask for across areas — extension, library, linkages, faculty development, and the checklist."
			/>
			<a
				href="/resources"
				class="inline-flex w-fit items-center gap-1.5 border-b border-ink pb-1 text-[11px] font-medium text-ink"
			>
				Institutional record
				<ArrowUpRight class="size-3.5" />
			</a>
		</div>

		<div class="mt-8 border-t border-rule">
			{#each program.programDocuments as document (document.id)}
				<DocumentRow
					{document}
					accent={program.accent}
					soft={program.accentSoft}
					context={`${program.code} · Program-wide`}
				/>
			{/each}
		</div>
	</div>
</section>
