<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import DocumentRow from '$lib/components/site/document-row.svelte';
	import { countLinked, documentKinds, dossierPath } from '$lib/data/accreditation';
	import type { Program, Section, Visit } from '$lib/data/types';
	import { pad2 } from '$lib/format';

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

	/** Group by document kind, in the order of `documentKinds`, unless the list is short or uniform. */
	const groups = $derived.by(() => {
		const kinds = new Set(section.documents.map((document) => document.kind));
		if (section.kind === 'common' || kinds.size < 2 || section.documents.length <= 3) {
			return [{ label: '', documents: section.documents }];
		}

		return documentKinds
			.filter((kind) => kind.value !== 'all' && kinds.has(kind.value))
			.map((kind) => ({
				label: kind.label,
				documents: section.documents.filter((document) => document.kind === kind.value)
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
				{groupName} · {linked} linked · {pending} in preparation
			</p>
			<h1 class="mt-2 text-balance font-display text-[clamp(1.9rem,4.4vw,3.4rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-ink">
				{section.kind === 'previous' && section.number ? `Area ${section.number}: ${section.title}` : section.title}
			</h1>
			<p class="mt-3 max-w-2xl text-pretty text-[14px] leading-relaxed text-ink-soft sm:text-[15px]">
				{section.description}
			</p>
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

	{#if section.documents.length > 0 && pending === section.documents.length}
		<div class="mt-6 border border-dashed border-ink/30 bg-paper p-4 text-[13px] leading-relaxed text-ink-soft">
			This section is in preparation. The structure is in place; the task force will link the evidence before the visit.
		</div>
	{/if}

	<div class="mt-8 space-y-10">
		{#each groups as group (group.label)}
			<section>
				{#if group.label}
					<div class="flex items-end justify-between gap-4 border-b border-ink/20 pb-2">
						<h2 class="font-display text-[20px] font-semibold tracking-[-0.03em] text-ink">{group.label}</h2>
						<span class="font-mono text-[12px] text-ink-soft">
							{group.documents.length} {group.documents.length === 1 ? 'file' : 'files'}
						</span>
					</div>
				{/if}
				<div class:border-t={!group.label} class="border-rule">
					{#each group.documents as document (document.id)}
						<DocumentRow {document} />
					{/each}
				</div>
			</section>
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
