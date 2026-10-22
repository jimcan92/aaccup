<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import DocumentRow from '$lib/components/site/document-row.svelte';
	import { activeVisit, countLinked, sectionsOf, visitBase } from '$lib/data/accreditation';
	import type { Program, Visit } from '$lib/data/types';
	import { pad2 } from '$lib/format';

	let { program, visit, base }: { program: Program; visit: Visit; base: string } = $props();

	const common = $derived(sectionsOf(visit, 'common'));
	const current = $derived(sectionsOf(visit, 'current'));
	const previous = $derived(sectionsOf(visit, 'previous'));
	const active = $derived(activeVisit(program));
</script>

<svelte:head>
	<title>{program.code} · {visit.year} {visit.label} · AACCUP · CTU Moalboal</title>
	<meta
		name="description"
		content={`${program.name} at CTU Moalboal — AACCUP ${visit.year} ${visit.label}. Common documents, current visit areas, and the previous visit record, linked to Google Drive.`}
	/>
</svelte:head>

{#snippet heading(eyebrow: string, title: string, count: string)}
	<div class="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b-2 border-program pb-2">
		<div>
			<p class="font-mono text-[12px] text-program-ink">{eyebrow}</p>
			<h2 class="mt-1 font-display text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-[-0.035em] text-ink">{title}</h2>
		</div>
		<p class="font-mono text-[12px] text-ink-soft">{count}</p>
	</div>
{/snippet}

<div class="space-y-14">
	{#if visit.status === 'archived'}
		<div class="border border-program/30 bg-paper p-4 text-[13px] leading-relaxed text-ink">
			This is an archived visit. The current {program.code} dossier is the
			<a href={visitBase(program, active)} class="font-medium text-program underline underline-offset-4">
				{active.year} {active.label}
			</a>.
		</div>
	{/if}

	{#each common as section (section.slug)}
		<section>
			{@render heading(
				'Common documents',
				`${program.code} records`,
				`${countLinked(section.documents)} / ${section.documents.length} linked`
			)}
			<div>
				{#each section.documents as document (document.id)}
					<DocumentRow {document} />
				{/each}
			</div>
		</section>
	{/each}

	{#if current.length > 0}
		<section>
			{@render heading(
				`Current visit · ${visit.year}`,
				`${current.length} ${current.length === 1 ? 'area' : 'areas'} under review`,
				`${countLinked(current.flatMap((s) => s.documents))} / ${current.flatMap((s) => s.documents).length} linked`
			)}
			<ul class="mt-5 grid gap-3 md:grid-cols-2">
				{#each current as section (section.slug)}
					{@const linked = countLinked(section.documents)}
					<li>
						<a
							href={`${base}/${section.slug}`}
							class="group flex h-full flex-col border border-rule bg-paper p-5 transition-colors hover:border-program/50 hover:bg-program-soft"
						>
							<div class="flex items-start justify-between gap-4">
								<span class="font-display text-[34px] font-semibold leading-none tracking-[-0.06em] text-program">
									{pad2(section.number ?? 0)}
								</span>
								<ArrowRight class="size-4 text-program transition-transform group-hover:translate-x-0.5" />
							</div>
							<h3 class="mt-4 font-display text-[21px] font-semibold tracking-[-0.03em] text-ink">{section.title}</h3>
							<p class="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{section.description}</p>
							<p class="mt-auto pt-4 font-mono text-[12px] text-ink-soft">
								{linked} linked · {section.documents.length - linked} in preparation
							</p>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if previous.length > 0}
		<section>
			{@render heading(
				visit.previousLabel ? `Previous visit · ${visit.previousLabel}` : 'Previous visit',
				'The 10-area record',
				`${countLinked(previous.flatMap((s) => s.documents))} / ${previous.flatMap((s) => s.documents).length} linked`
			)}
			<p class="mt-4 max-w-2xl border-l-2 border-program/40 pl-4 text-[13px] leading-relaxed text-ink-soft">
				Recommendations and compliance reports from the previous survey. Use these to check how each
				recommendation was answered; they are not the current visit evidence.
			</p>
			<ol class="mt-5 border-t border-rule">
				{#each previous as section (section.slug)}
					{@const linked = countLinked(section.documents)}
					<li>
						<a
							href={`${base}/${section.slug}`}
							class="group grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-rule px-1 py-3 transition-colors hover:bg-program-soft sm:grid-cols-[3rem_minmax(0,1fr)_7rem_1rem] sm:px-3"
						>
							<span class="font-mono text-[13px] text-program-ink">{section.number ? pad2(section.number) : '··'}</span>
							<span class="min-w-0">
								<span class="block truncate text-[14px] font-medium text-ink">{section.title}</span>
								<span class="block text-[12px] text-ink-soft sm:hidden">{linked}/{section.documents.length} linked</span>
							</span>
							<span class="hidden font-mono text-[12px] text-ink-soft sm:block">{linked}/{section.documents.length} linked</span>
							<ArrowUpRight class="size-4 text-program opacity-60 transition-opacity group-hover:opacity-100" />
						</a>
					</li>
				{/each}
			</ol>
		</section>
	{/if}
</div>
