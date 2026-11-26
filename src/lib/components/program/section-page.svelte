<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import DocumentRow from '#lib/components/site/document-row.svelte';
	import RecommendationMatrix from './recommendation-matrix.svelte';
	import { countLinked, documentKinds, dossierPath } from '#lib/data/accreditation.js';
	import type { Program, Section, Visit } from '#lib/data/types.js';
	import { formatDate, manilaDay, pad2 } from '#lib/format.js';

	let {
		program,
		visit,
		base,
		section,
		previous,
		next
	}: {
		program: Program;
		visit: Visit;
		base: string;
		section: Section;
		previous: Section | null;
		next: Section | null;
	} = $props();

	const linked = $derived(countLinked(section.documents));
	const pending = $derived(section.documents.length - linked);
	const updated = $derived(formatDate(manilaDay(section.updatedAt)));

	const groupName = $derived(
		section.kind === 'common'
			? 'Common documents'
			: section.kind === 'current'
				? `Current visit · ${visit.year}`
				: visit.previousLabel
					? `Previous visit · ${visit.previousLabel}`
					: 'Previous visit'
	);

	const marker = $derived(
		section.kind === 'common' ? '§' : section.number ? pad2(section.number) : '··'
	);

	/**
	 * Narrative and compliance reports get groups of their own; every other kind shares one
	 * "Supporting evidence" group. No groups when the list is short or uniform.
	 */
	const groups = $derived.by(() => {
		const own = new Set(['compliance', 'narrative']);
		// Drive folders number the area's narrative/compliance report 0 ("IX-0 …"), whatever its saved kind.
		const bucket = (document: { kind: string; title: string }) =>
			own.has(document.kind) ? document.kind : /^[IVX]+-0\b/i.test(document.title) ? 'compliance' : 'supporting';
		const buckets = new Set(section.documents.map(bucket));
		if (section.kind === 'common' || buckets.size < 2 || section.documents.length <= 3) {
			return [{ label: '', open: true, documents: section.documents }];
		}

		const present = documentKinds.filter((kind) => buckets.has(kind.value as string));
		// Only the narrative opens by default; with no narrative, the first group opens instead.
		const opener = buckets.has('narrative') ? 'narrative' : present[0]?.value;
		return present.map((kind) => ({
			label: kind.label,
			open: kind.value === opener,
			documents: section.documents.filter((document) => bucket(document) === kind.value)
		}));
	});

	function navLabel(item: Section): string {
		if (item.kind === 'previous' && item.number) return `Area ${item.number} · ${item.shortTitle}`;
		return item.shortTitle;
	}
</script>

<svelte:head>
	<title>{section.title} · {program.code} {visit.year} · AACCUP · CTU Moalboal</title>
	<meta name="description" content={`${program.code} ${groupName} — ${section.title}. ${section.description}`} />
</svelte:head>

<article>
	<nav aria-label="Breadcrumb" class="flex flex-wrap items-center gap-1.5 text-[12px] text-ink-soft">
		<a href={dossierPath(program, visit)} class="transition-colors hover:text-program-ink">{program.code} {visit.year}</a>
		<ChevronRight class="size-3" />
		<span>{groupName}</span>
		<ChevronRight class="size-3" />
		<span class="font-medium text-ink" aria-current="page">{section.shortTitle}</span>
	</nav>

	<header class="mt-5 grid gap-4 border-b-2 border-program pb-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start sm:gap-7">
		<span
			class="font-display text-[clamp(3.5rem,9vw,6rem)] font-semibold leading-[0.75] tracking-[-0.08em] text-program"
			aria-hidden="true"
		>
			{marker}
		</span>
		<div class="min-w-0">
			<p class="font-mono text-[12px] text-program-ink">
				{groupName} · {linked} {linked === 1 ? 'document' : 'documents'} linked
			</p>
			<h1 class="mt-2 text-balance font-display text-[clamp(1.9rem,4.4vw,3.4rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-ink">
				{section.kind === 'previous' && section.number ? `Area ${section.number}: ${section.title}` : section.title}
			</h1>
			<p class="mt-3 max-w-2xl text-pretty text-[14px] leading-relaxed text-ink-soft sm:text-[15px]">
				{section.description}
			</p>
			{#if section.chair || updated}
				<dl class="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[12px]">
					{#if section.chair}
						<div class="flex gap-1.5"><dt class="font-mono text-ink-soft">Area chair</dt><dd class="font-medium text-ink">{section.chair}</dd></div>
					{/if}
					{#if updated}
						<div class="flex gap-1.5"><dt class="font-mono text-ink-soft">Last updated</dt><dd class="font-medium text-ink">{updated}</dd></div>
					{/if}
				</dl>
			{/if}
		</div>
	</header>

	{#if section.kind === 'previous'}
		<p class="mt-5 border-l-2 border-program/40 pl-4 text-[13px] leading-relaxed text-ink-soft">
			Previous-visit record. These files answer the last survey’s recommendations; the current visit evidence is under
			<a href={dossierPath(program, visit)} class="font-medium text-program-ink underline underline-offset-4">Current visit</a>.
		</p>
	{/if}

	{#if section.focus}
		<div class="mt-6 border border-rule bg-paper p-5">
			<p class="font-mono text-[12px] text-program-ink">What the evaluator will look for</p>
			<p class="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink">{section.focus}</p>
		</div>
	{/if}

	{#if section.recommendations?.length}
		<RecommendationMatrix items={section.recommendations} />
	{/if}

	<!-- Nothing published yet, or only rows still waiting for a Drive link. The requested-documents section starts empty on purpose. -->
	{#if pending === section.documents.length && section.slug !== 'additional-documents'}
		<div class="mt-6 border border-dashed border-ink/30 bg-paper p-4 text-[13px] leading-relaxed text-ink-soft">
			This section is in preparation. The structure is in place; the task force will link the evidence before the visit.
		</div>
	{/if}

	<div class="mt-8 space-y-10">
		{#each groups as group (`${section.slug}:${group.label}`)}
			{#if group.label}
				<details open={group.open} class="group/kind">
					<summary
						class="flex cursor-pointer list-none items-end justify-between gap-4 border-b border-ink/20 pb-2 transition-colors hover:border-program/50 [&::-webkit-details-marker]:hidden"
					>
						<h2 class="flex items-center gap-2 font-display text-[20px] font-semibold tracking-[-0.03em] text-ink">
							<ChevronDown class="size-4 shrink-0 -rotate-90 text-program transition-transform group-open/kind:rotate-0" />
							{group.label}
						</h2>
						<span class="font-mono text-[12px] text-ink-soft">
							{group.documents.length} {group.documents.length === 1 ? 'file' : 'files'}
						</span>
					</summary>
					<div class="border-rule">
						{#each group.documents as document (document.id)}
							<DocumentRow {document} />
						{/each}
					</div>
				</details>
			{:else}
				<section class="border-t border-rule">
					{#each group.documents as document (document.id)}
						<DocumentRow {document} />
					{/each}
				</section>
			{/if}
		{:else}
			<div class="border border-dashed border-ink/30 bg-paper p-6 text-[13px] text-ink-soft">
				No documents in this section yet.
			</div>
		{/each}
	</div>
</article>

<nav class="mt-14 grid grid-cols-2 gap-3 border-t border-rule pt-5" aria-label="Previous and next section">
	{#if previous}
		<a
			href={`${base}/${previous.slug}`}
			class="group flex min-w-0 items-center gap-3 border border-transparent p-2 text-[13px] text-ink-soft transition-colors hover:border-rule hover:bg-paper"
		>
			<ArrowLeft class="size-4 shrink-0 text-program transition-transform group-hover:-translate-x-0.5" />
			<span class="min-w-0">
				<span class="block font-mono text-[11px]">Previous</span>
				<span class="block truncate font-medium text-ink">{navLabel(previous)}</span>
			</span>
		</a>
	{:else}
		<span></span>
	{/if}

	{#if next}
		<a
			href={`${base}/${next.slug}`}
			class="group flex min-w-0 items-center justify-end gap-3 border border-transparent p-2 text-right text-[13px] text-ink-soft transition-colors hover:border-rule hover:bg-paper"
		>
			<span class="min-w-0">
				<span class="block font-mono text-[11px]">Next</span>
				<span class="block truncate font-medium text-ink">{navLabel(next)}</span>
			</span>
			<ArrowRight class="size-4 shrink-0 text-program transition-transform group-hover:translate-x-0.5" />
		</a>
	{/if}
</nav>
