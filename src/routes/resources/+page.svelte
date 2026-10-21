<script lang="ts">
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import DocumentRow from '$lib/components/site/document-row.svelte';
	import InstitutionalCard from '$lib/components/site/institutional-card.svelte';
	import SectionHeading from '$lib/components/site/section-heading.svelte';
	import { institutionalDocuments, programs } from '$lib/data/accreditation';
	import { site } from '$lib/data/site';
</script>

<svelte:head>
	<title>Institutional record · AACCUP Level III · CTU Moalboal</title>
	<meta
		name="description"
		content="Certification, board resolution, COPC, checklist, and program-wide evidence for the CTU Moalboal AACCUP Level III visit."
	/>
</svelte:head>

<section class="border-b border-rule bg-salt">
	<div class="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 lg:py-16">
		<div class="flex items-center gap-3 font-mono text-[10px] text-ink-soft">
			<span class="h-px w-6 bg-ink/25" aria-hidden="true"></span>
			<span>Resources</span>
		</div>
		<h1
			class="mt-4 max-w-3xl text-balance font-display text-[clamp(2.6rem,6vw,5.2rem)] font-semibold leading-[0.9] tracking-[-0.06em]"
		>
			The institutional record.
		</h1>
		<p class="mt-4 max-w-2xl text-[14px] leading-relaxed text-ink-soft sm:text-[15px]">
			The records that sit under both volumes, plus the program-wide evidence that does not belong to a single AACCUP area.
		</p>
	</div>
</section>

<section class="bg-paper">
	<div class="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 lg:py-16">
		<SectionHeading
			eyebrow="Shared documents"
			title="Start with the record that frames the visit."
			description="Certification, board action, COPC, and the checklist are the first things an evaluator asks for. Where a link is still pending, the card says so."
		/>

		<div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each institutionalDocuments as document (document.id)}
				<InstitutionalCard {document} />
			{/each}
		</div>
	</div>
</section>

{#each programs as program, index (program.slug)}
	<section class:border-t={index === 0} class="border-rule" class:bg-salt={index % 2 === 0}>
		<div class="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 lg:py-16">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<div class="flex items-center gap-2.5 font-mono text-[10px] text-ink-soft">
						<span class="size-2" style:background={program.accent} aria-hidden="true"></span>
						<span>{program.code} · {program.level}</span>
					</div>
					<h2 class="mt-3 font-display text-[clamp(1.8rem,3.4vw,2.8rem)] font-semibold leading-[0.98] tracking-[-0.045em]">
						{program.code} program-wide evidence
					</h2>
					<p class="mt-2 max-w-xl text-[13px] leading-relaxed text-ink-soft">
						Supporting records that cross areas: extension, library, linkages, faculty development, and the checklist.
					</p>
				</div>

				<a
					href={`/programs/${program.slug}`}
					class="inline-flex w-fit items-center gap-1.5 border-b border-ink pb-1 text-[11px] font-medium text-ink"
				>
					Open the {program.code} volume
					<ArrowUpRight class="size-3.5" />
				</a>
			</div>

			<div class="mt-6 border-t border-rule">
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
{/each}

<section class="border-t border-rule bg-ink text-paper">
	<div class="mx-auto max-w-[1280px] px-5 py-10 sm:px-8">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<p class="max-w-2xl text-[12px] leading-relaxed text-paper/60">{site.driveNote}</p>
			<a
				href="/documents"
				class="inline-flex w-fit items-center gap-1.5 border-b border-paper/40 pb-1 text-[11px] font-medium text-paper"
			>
				Search every document
				<ArrowUpRight class="size-3.5" />
			</a>
		</div>
	</div>
</section>
