<script lang="ts">
	import { onMount } from 'svelte';
	import Search from '@lucide/svelte/icons/search';
	import X from '@lucide/svelte/icons/x';
	import DocumentRow from '$lib/components/site/document-row.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { documentIndex, documentKinds } from '$lib/data/accreditation';
	import { kindLabel, pad2 } from '$lib/format';
	import type { IndexedDocument, Program, Visit } from '$lib/data/types';

	let { program, visit, base }: { program: Program; visit: Visit; base: string } = $props();

	// documentIndex keeps the visit's reading order: common, current, previous.
	const allDocuments = $derived(documentIndex(visit));

	const sections = [
		{ value: 'all', label: 'All groups' },
		{ value: 'common', label: 'Common documents' },
		{ value: 'current', label: 'Current visit' },
		{ value: 'previous', label: 'Previous visit' }
	] as const;

	const areaOptions = $derived(
		visit.sections.map((section) => ({
			value: section.slug,
			label:
				section.kind === 'common'
					? section.title
					: `${section.kind === 'current' ? 'Current' : 'Previous'} · ${section.number ? `${pad2(section.number)} ` : ''}${section.shortTitle}`
		}))
	);

	let q = $state('');
	let sectionFilter = $state('all');
	let areaFilter = $state('all');
	let kindFilter = $state('all');
	let searchInput = $state<HTMLInputElement | null>(null);
	let ready = $state(false);

	onMount(() => {
		const params = new URLSearchParams(window.location.search);
		const section = params.get('section');

		const area = params.get('area');

		q = params.get('q') ?? '';
		sectionFilter = sections.some((item) => item.value === section) ? (section as string) : 'all';
		areaFilter = areaOptions.some((item) => item.value === area) ? (area as string) : 'all';
		kindFilter = params.get('kind') ?? 'all';
		ready = true;
	});

	const normalizedQuery = $derived(q.trim().toLowerCase());
	const hasFilters = $derived(
		q.trim() !== '' || sectionFilter !== 'all' || areaFilter !== 'all' || kindFilter !== 'all'
	);

	const results = $derived.by(() => {
		return allDocuments.filter((document) => {
			if (sectionFilter !== 'all' && document.section.kind !== sectionFilter) return false;
			if (areaFilter !== 'all' && document.section.slug !== areaFilter) return false;

			if (kindFilter !== 'all' && document.kind !== kindFilter) return false;

			if (!normalizedQuery) return true;

			const haystack = [
				document.title,
				document.note,
				document.section.title,
				document.section.shortTitle,
				document.sectionLabel,
				kindLabel(document.kind)
			]
				.filter(Boolean)
				.join(' ')
				.toLowerCase();

			return haystack.includes(normalizedQuery);
		});
	});

	const linkedResults = $derived(results.filter((document) => document.status === 'linked').length);

	$effect(() => {
		if (!ready) return;

		const params = new URLSearchParams();
		if (q.trim()) params.set('q', q.trim());
		if (sectionFilter !== 'all') params.set('section', sectionFilter);
		if (areaFilter !== 'all') params.set('area', areaFilter);
		if (kindFilter !== 'all') params.set('kind', kindFilter);

		const query = params.toString();
		history.replaceState(history.state, '', `${base}/documents${query ? `?${query}` : ''}`);
	});

	function reset() {
		q = '';
		sectionFilter = 'all';
		areaFilter = 'all';
		kindFilter = 'all';
	}

	function handleShortcut(event: KeyboardEvent) {
		const target = event.target as HTMLElement | null;
		const tag = target?.tagName;

		if (event.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
			event.preventDefault();
			searchInput?.focus();
		}
	}

	function contextFor(document: IndexedDocument): string {
		return `${document.sectionLabel} · ${kindLabel(document.kind)}`;
	}
</script>

<svelte:head>
	<title>Search · {program.code} {visit.year} · AACCUP · CTU Moalboal</title>
	<meta name="description" content={`Search every record in the ${program.code} ${visit.year} AACCUP dossier at CTU Moalboal.`} />
</svelte:head>

<svelte:window onkeydown={handleShortcut} />

<header class="border-b-2 border-program pb-5">
	<p class="font-mono text-[12px] text-program-ink">{program.code} · {visit.year} {visit.label}</p>
	<h1 class="mt-2 font-display text-[clamp(1.9rem,4.4vw,3.4rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-ink">
		Search documents
	</h1>
	<p class="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-soft">
		Every common, current-visit, and previous-visit record in {program.code}. Press
		<kbd class="border border-ink/20 bg-paper px-1.5 py-0.5 font-mono text-[11px]">/</kbd>
		to search.
	</p>
</header>

<section class="mt-6">

	<div>
		<div class="border border-rule bg-paper p-4 sm:p-5">
			<div class="grid gap-3 md:grid-cols-[1fr_12rem_12rem]">
				<div class="relative">
					<Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
					<Input
						bind:ref={searchInput}
						bind:value={q}
						type="search"
						placeholder="Search title, area, or keyword"
						class="h-11 rounded-none border-rule bg-salt pl-9 pr-9 text-[14px] shadow-none focus-visible:ring-2 focus-visible:ring-program/40"
						aria-label="Search documents"
					/>
					{#if q}
						<button
							type="button"
							onclick={() => (q = '')}
							class="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center text-ink-soft hover:text-ink"
							aria-label="Clear search"
						>
							<X class="size-3.5" />
						</button>
					{/if}
				</div>

				<Select.Root type="single" bind:value={sectionFilter}>
					<Select.Trigger class="h-11 w-full rounded-none border-rule bg-salt px-3 text-[13px] shadow-none" aria-label="Filter by group">
						{sections.find((section) => section.value === sectionFilter)?.label ?? 'All groups'}
					</Select.Trigger>
					<Select.Content>
						{#each sections as section (section.value)}
							<Select.Item value={section.value}>{section.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>

				<Select.Root type="single" bind:value={kindFilter}>
					<Select.Trigger class="h-11 w-full rounded-none border-rule bg-salt px-3 text-[13px] shadow-none" aria-label="Filter by document type">
						{kindFilter === 'all'
							? 'All document types'
							: (documentKinds.find((kind) => kind.value === kindFilter)?.label ?? 'Document type')}
					</Select.Trigger>
					<Select.Content>
						{#each documentKinds as kind (kind.value)}
							<Select.Item value={kind.value}>{kind.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<div class="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
				<Select.Root type="single" bind:value={areaFilter}>
					<Select.Trigger class="h-10 w-full rounded-none border-rule bg-salt px-3 text-[13px] shadow-none" aria-label="Filter by section">
						{areaFilter === 'all'
							? 'All sections'
							: (areaOptions.find((area) => area.value === areaFilter)?.label ?? 'Area')}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="all">All sections</Select.Item>
						{#each areaOptions as area (area.value)}
							<Select.Item value={area.value}>{area.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>

				<p class="self-center text-[12px] text-ink-soft">
					Only {program.code} records are searched.
				</p>

				{#if hasFilters}
					<button
						type="button"
						onclick={reset}
						class="inline-flex h-10 items-center justify-center gap-1 border border-rule px-3 text-[12px] text-ink-soft transition-colors hover:text-ink"
					>
						Clear filters
						<X class="size-3" />
					</button>
				{/if}
			</div>
		</div>

		<div class="mt-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
			<p class="text-[13px] text-ink-soft" aria-live="polite">
				<span class="font-medium text-ink">{results.length}</span>
				{results.length === 1 ? 'record' : 'records'} · {linkedResults} linked
			</p>
			<p class="text-[12px] text-ink-soft">Every linked row opens its source in a new tab.</p>
		</div>

		<div class="mt-4 border-t border-rule">
			{#each results as document (document.id)}
				<DocumentRow
					{document}
					context={contextFor(document)}
				/>
			{:else}
				<div class="border border-dashed border-ink/30 bg-paper p-8 text-center">
					<p class="font-display text-2xl font-semibold tracking-[-0.03em]">No matching records.</p>
					<p class="mx-auto mt-2 max-w-md text-[12px] leading-relaxed text-ink-soft">
						Try a shorter keyword, choose a different section or area, or clear the filters.
					</p>
					<button
						type="button"
						onclick={reset}
						class="on-program mt-5 inline-flex h-10 items-center justify-center bg-program px-4 text-[13px] font-medium text-program-contrast transition-opacity hover:opacity-90"
					>
						Clear filters
					</button>
				</div>
			{/each}
		</div>
	</div>
</section>
