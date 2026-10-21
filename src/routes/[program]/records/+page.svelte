<script lang="ts">
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import InstitutionalCard from '$lib/components/site/institutional-card.svelte';
	import SectionHeading from '$lib/components/site/section-heading.svelte';
	import { institutionalDocuments } from '$lib/data/accreditation';
	import { site } from '$lib/data/site';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const program = $derived(data.program);
</script>

<svelte:head>
	<title>Records · {program.code} · AACCUP 2026</title>
	<meta name="description" content={`Shared institutional records for the ${program.code} AACCUP visit at CTU Moalboal.`} />
</svelte:head>

<section class="border-b border-rule bg-salt">
	<div class="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 lg:py-16">
		<div class="flex items-center gap-3 font-mono text-[9px] text-ink-soft">
			<span class="h-px w-6 bg-ink/25" aria-hidden="true"></span>
			<span>{program.code} · Records</span>
		</div>
		<h1 class="mt-4 max-w-3xl text-balance font-display text-[clamp(2.6rem,6vw,5rem)] font-semibold leading-[0.9] tracking-[-0.06em]">
			The shared record.
		</h1>
		<p class="mt-4 max-w-2xl text-[14px] leading-relaxed text-ink-soft sm:text-[15px]">
			Certification, board action, COPC, and the checklist sit under both volumes. The URL stays inside {program.code}, but the source is the same.
		</p>
	</div>
</section>

<section class="bg-paper">
	<div class="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 lg:py-16">
		<SectionHeading
			eyebrow="Shared documents"
			title="Start with the record that frames the visit."
			description="Where a link is still in preparation, the card says so. Do not treat an empty slot as a completed record."
		/>

		<div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each institutionalDocuments as document (document.id)}
				<InstitutionalCard {document} />
			{/each}
		</div>

		<div class="mt-8 flex flex-col gap-4 border-t border-rule pt-5 sm:flex-row sm:items-center sm:justify-between">
			<p class="max-w-xl text-[10px] leading-relaxed text-ink-soft">{site.driveNote}</p>
			<div class="flex flex-wrap gap-4">
				<a
					href={`/${program.slug}/documents`}
					class="inline-flex items-center gap-1.5 border-b border-ink pb-1 text-[10px] font-medium text-ink"
				>
					Search this volume
					<ArrowUpRight class="size-3.5" />
				</a>
				<a
					href={`/${program.slug}`}
					class="inline-flex items-center gap-1.5 border-b border-ink pb-1 text-[10px] font-medium text-ink"
				>
					Back to {program.code}
					<ArrowUpRight class="size-3.5" />
				</a>
			</div>
		</div>
	</div>
</section>
