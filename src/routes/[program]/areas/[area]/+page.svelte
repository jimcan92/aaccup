<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import DocumentRow from '$lib/components/site/document-row.svelte';
	import { countLinked } from '$lib/data/accreditation';
	import { kindLabel, pad2 } from '$lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const program = $derived(data.program);
	const area = $derived(data.area);
	const linked = $derived(countLinked(area.documents));
	const pending = $derived(area.documents.length - linked);

	const groups = $derived(
		[
			{
				label: 'Recommendations',
				documents: area.documents.filter((document) => document.kind === 'recommendation')
			},
			{
				label: 'Compliance and narrative',
				documents: area.documents.filter(
					(document) => document.kind === 'compliance' || document.kind === 'narrative'
				)
			},
			{
				label: 'Supporting evidence',
				documents: area.documents.filter(
					(document) =>
						document.kind !== 'recommendation' &&
						document.kind !== 'compliance' &&
						document.kind !== 'narrative'
				)
			}
		].filter((group) => group.documents.length > 0)
	);
</script>

<svelte:head>
	<title>Area {area.number}: {area.title} · Previous visit · {program.code}</title>
	<meta
		name="description"
		content={`${program.code} previous visit — Area ${area.number}, ${area.title}. Recommendations and compliance evidence from the last survey.`}
	/>
</svelte:head>

<section
	class="border-b border-rule"
	style:background={program.accentSoft}
	style:--area-accent={program.accent}
>
	<div class="mx-auto max-w-[1280px] px-5 py-10 sm:px-8 lg:py-14">
		<nav aria-label="Breadcrumb" class="flex flex-wrap items-center gap-2 text-[10px] text-ink-soft">
			<a href="/" class="transition-colors hover:text-ink">Dossier</a>
			<ChevronRight class="size-3" />
			<a href={`/${program.slug}`} class="transition-colors hover:text-ink">{program.code}</a>
			<ChevronRight class="size-3" />
			<a href={`/${program.slug}#previous`} class="transition-colors hover:text-ink">Previous visit</a>
			<ChevronRight class="size-3" />
			<span class="text-ink">Area {pad2(area.number)}</span>
		</nav>

		<div class="mt-7 grid gap-6 lg:grid-cols-[auto_1fr] lg:items-start lg:gap-10">
			<span
				class="block font-display text-[clamp(5rem,12vw,9rem)] font-semibold leading-[0.7] tracking-[-0.08em]"
				style:color={program.accent}
				aria-hidden="true"
			>
				{pad2(area.number)}
			</span>

			<div>
				<div class="flex flex-wrap items-center gap-3 font-mono text-[10px] text-ink-soft">
					<span class="flex items-center gap-2">
						<span class="size-1.5" style:background={program.accent} aria-hidden="true"></span>
						{program.code} · Previous visit{program.previousVisitLabel ? ` · ${program.previousVisitLabel}` : ''}
					</span>
					<span class="h-px w-5 bg-ink/20" aria-hidden="true"></span>
					<span>{linked} linked · {area.documents.length} total</span>
				</div>

				<h1
					class="mt-3 max-w-4xl text-balance font-display text-[clamp(2.2rem,5.2vw,4.6rem)] font-semibold leading-[0.92] tracking-[-0.055em] text-ink"
				>
					{area.title}
				</h1>

				<p class="mt-4 max-w-2xl text-pretty text-[14px] leading-relaxed text-ink-soft sm:text-[15px]">
					{area.description}
				</p>
			</div>
		</div>
	</div>
</section>

<section class="bg-salt">
	<div class="mx-auto grid max-w-[1280px] gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_18rem] lg:py-16">
		<div>
			<div class="mb-6 border-l-2 border-ink/25 pl-4">
				<p class="font-mono text-[9px] text-ink-soft">Previous visit{program.previousVisitLabel ? ` · ${program.previousVisitLabel}` : ''}</p>
				<p class="mt-1 max-w-2xl text-[12px] leading-relaxed text-ink-soft">
					This is the compliance record from the previous visit. It is not the current visit evidence. Return to the current visit for the areas under review in {program.surveyYear}.
				</p>
			</div>

			{#if area.documents.length === 0}
				<div class="border border-dashed border-ink/25 bg-paper p-6">
					<p class="font-display text-xl font-semibold tracking-[-0.03em]">No previous-visit evidence linked yet.</p>
					<p class="mt-2 max-w-lg text-[12px] leading-relaxed text-ink-soft">
						This area has no documents in the index. Coordinate with the area chair through the Campus AACCUP Task Force.
					</p>
				</div>
			{/if}

			{#if pending > 0 && area.documents.length > 0}
				<div class="mb-6 border border-dashed border-ink/25 bg-paper p-4 text-[12px] leading-relaxed text-ink-soft">
					{pending} {pending === 1 ? 'record is' : 'records are'} still in preparation for this area.
				</div>
			{/if}

			{#each groups as group, index (group.label)}
				<section class:mt-10={index > 0}>
					<div class="flex items-end justify-between gap-4 border-b border-ink/20 pb-2">
						<h2 class="font-display text-[22px] font-semibold tracking-[-0.035em] text-ink">
							{group.label}
						</h2>
						<span class="font-mono text-[9px] text-ink-soft">
							{group.documents.length} {group.documents.length === 1 ? 'file' : 'files'}
						</span>
					</div>
					<div class="border-t border-rule">
						{#each group.documents as document (document.id)}
							<DocumentRow
								{document}
								accent={program.accent}
								soft={program.accentSoft}
								context={`Previous visit · ${kindLabel(document.kind)}`}
							/>
						{/each}
					</div>
				</section>
			{/each}
		</div>

		<aside class="lg:sticky lg:top-24 lg:self-start">
			<div class="border border-rule bg-paper p-5">
				<p class="font-mono text-[9px] text-ink-soft">Previous visit — 10 areas</p>
				<nav class="mt-3 flex flex-col" aria-label={`Previous visit areas in ${program.code}`}>
					{#each program.areas as item (item.number)}
						<a
							href={`/${program.slug}/areas/${item.slug}`}
							class="flex items-center gap-3 border-b border-rule py-2.5 text-[11px] transition-colors hover:text-ink"
							class:text-ink={item.number === area.number}
							class:font-medium={item.number === area.number}
							class:text-ink-soft={item.number !== area.number}
							style:color={item.number === area.number ? program.accent : undefined}
							aria-current={item.number === area.number ? 'page' : undefined}
						>
							<span class="w-5 shrink-0 font-mono text-[9px]">{pad2(item.number)}</span>
							<span class="truncate">{item.shortTitle}</span>
						</a>
					{/each}
				</nav>
			</div>

			<div class="mt-4 border border-rule bg-paper p-5">
				<p class="font-mono text-[9px] text-ink-soft">Current visit</p>
				<p class="mt-2 text-[11px] leading-relaxed text-ink-soft">
					The four areas under review in {program.surveyYear} are the current evidence.
				</p>
				<a
					href={`/${program.slug}#current`}
					class="mt-4 inline-flex items-center gap-1.5 border-b border-ink pb-1 text-[10px] font-medium text-ink"
				>
					Back to the current visit
					<ArrowUpRight class="size-3.5" />
				</a>
			</div>
		</aside>
	</div>
</section>

<nav class="border-t border-rule bg-paper" aria-label="Previous and next area">
	<div class="mx-auto flex max-w-[1280px] items-stretch justify-between px-5 sm:px-8">
		{#if data.previous}
			<a
				href={`/${program.slug}/areas/${data.previous.slug}`}
				class="group flex max-w-[48%] items-center gap-3 py-5 text-[11px] text-ink-soft transition-colors hover:text-ink"
			>
				<ArrowLeft class="size-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
				<span class="min-w-0">
					<span class="block font-mono text-[9px]">Area {pad2(data.previous.number)}</span>
					<span class="mt-0.5 block truncate font-medium text-ink">{data.previous.shortTitle}</span>
				</span>
			</a>
		{:else}
			<span></span>
		{/if}

		{#if data.next}
			<a
				href={`/${program.slug}/areas/${data.next.slug}`}
				class="group flex max-w-[48%] items-center gap-3 py-5 text-right text-[11px] text-ink-soft transition-colors hover:text-ink"
			>
				<span class="min-w-0">
					<span class="block font-mono text-[9px]">Area {pad2(data.next.number)}</span>
					<span class="mt-0.5 block truncate font-medium text-ink">{data.next.shortTitle}</span>
				</span>
				<ArrowRight class="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
			</a>
		{:else}
			<span></span>
		{/if}
	</div>
</nav>
