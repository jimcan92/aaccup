<script lang="ts">
	import { onMount } from 'svelte';
	import Search from '@lucide/svelte/icons/search';
	import X from '@lucide/svelte/icons/x';
	import DocumentRow from '$lib/components/site/document-row.svelte';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { documentIndex, documentKinds } from '$lib/data/accreditation';
	import { kindLabel, pad2 } from '$lib/format';
	import type { IndexedDocument } from '$lib/data/types';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const program = $derived(data.program);
	const allDocuments = $derived(
		documentIndex(program).sort((a, b) => {
			const order = { current: 0, previous: 1, program: 2, records: 3 };
			if (order[a.scope] !== order[b.scope]) return order[a.scope] - order[b.scope];
			return (a.areaNumber ?? 0) - (b.areaNumber ?? 0);
		})
	);

	const sections = [
		{ value: 'all', label: 'All sections' },
		{ value: 'current', label: 'Current visit' },
		{ value: 'previous', label: 'Previous visit' },
		{ value: 'program', label: 'Program-wide' },
		{ value: 'records', label: 'Shared records' }
	] as const;

	const areaOptions = $derived([
		...program.currentVisitAreas.map((area) => ({
			value: `current:${area.number}`,
			label: `Current · ${pad2(area.number)} ${area.shortTitle}`
		})),
		...program.areas.map((area) => ({
			value: `previous:${area.number}`,
			label: `Previous · ${pad2(area.number)} ${area.shortTitle}`
		}))
	]);

	let q = $state('');
	let sectionFilter = $state('all');
	let areaFilter = $state('all');
	let kindFilter = $state('all');
	let searchInput = $state<HTMLInputElement | null>(null);
	let ready = $state(false);

	onMount(() => {
		const params = new URLSearchParams(window.location.search);
		const section = params.get('section');

		q = params.get('q') ?? '';
		sectionFilter = sections.some((item) => item.value === section) ? (section as string) : 'all';
		areaFilter = params.get('area') ?? 'all';
		kindFilter = params.get('kind') ?? 'all';
		ready = true;
	});

	const normalizedQuery = $derived(q.trim().toLowerCase());
	const hasFilters = $derived(
		q.trim() !== '' || sectionFilter !== 'all' || areaFilter !== 'all' || kindFilter !== 'all'
	);

	const results = $derived.by(() => {
		return allDocuments.filter((document) => {
			if (sectionFilter !== 'all' && document.scope !== sectionFilter) return false;

			if (areaFilter !== 'all') {
				const [scope, number] = areaFilter.split(':');
				if (document.scope !== scope || document.areaNumber !== Number(number)) return false;
			}

			if (kindFilter !== 'all' && document.kind !== kindFilter) return false;

			if (!normalizedQuery) return true;

			const haystack = [
				document.title,
				document.note,
				document.programCode,
				document.programName,
				document.areaTitle,
				document.areaShortTitle,
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
		history.replaceState(null, '', `/${program.slug}/documents${query ? `?${query}` : ''}`);
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
	<title>Documents · {program.code} · AACCUP 2026</title>
	<meta name="description" content={`Search every linked record in the ${program.code} AACCUP dossier at CTU Moalboal.`} />
</svelte:head>

<svelte:window onkeydown={handleShortcut} />

<section class="border-b border-rule bg-salt">
	<div class="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 lg:py-16">
		<div class="flex items-center gap-3 font-mono text-[9px] text-ink-soft">
			<span class="h-px w-6 bg-ink/25" aria-hidden="true"></span>
			<span>{program.code} · Documents</span>
		</div>
		<h1 class="mt-4 max-w-3xl text-balance font-display text-[clamp(2.6rem,6vw,5rem)] font-semibold leading-[0.9] tracking-[-0.06em]">
			Search this volume.
		</h1>
		<p class="mt-4 max-w-2xl text-[14px] leading-relaxed text-ink-soft sm:text-[15px]">
			Every current-visit, previous-visit, program-wide, and shared record in {program.code}. Press
			<kbd class="border border-ink/20 bg-paper px-1.5 py-0.5 font-mono text-[10px]">/</kbd>
			to search.
		</p>
	</div>
</section>

<section class="bg-paper">
	<div class="mx-auto max-w-[1280px] px-5 py-8 sm:px-8 lg:py-10">
		<div class="border border-rule bg-salt p-4 sm:p-5">
			<div class="grid gap-3 md:grid-cols-[1fr_12rem_12rem]">
				<div class="relative">
					<Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
					<Input
						bind:ref={searchInput}
						bind:value={q}
						type="search"
						placeholder="Search title, area, or keyword"
						class="h-11 rounded-none border-rule bg-paper pl-9 pr-9 text-[13px] shadow-none focus-visible:ring-2 focus-visible:ring-signal/40"
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
					<Select.Trigger class="h-11 w-full rounded-none border-rule bg-paper px-3 text-[12px] shadow-none" aria-label="Filter by section">
						{sections.find((section) => section.value === sectionFilter)?.label ?? 'All sections'}
					</Select.Trigger>
					<Select.Content>
						{#each sections as section (section.value)}
							<Select.Item value={section.value}>{section.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>

				<Select.Root type="single" bind:value={kindFilter}>
					<Select.Trigger class="h-11 w-full rounded-none border-rule bg-paper px-3 text-[12px] shadow-none" aria-label="Filter by document type">
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
					<Select.Trigger class="h-10 w-full rounded-none border-rule bg-paper px-3 text-[12px] shadow-none" aria-label="Filter by area">
						{areaFilter === 'all'
							? 'All areas'
							: (areaOptions.find((area) => area.value === areaFilter)?.label ?? 'Area')}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="all">All areas</Select.Item>
						{#each areaOptions as area (area.value)}
							<Select.Item value={area.value}>{area.label}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>

				<p class="self-center text-[10px] text-ink-soft">
					Scoped to {program.code}. Use the volume selector to search BSFI.
				</p>

				{#if hasFilters}
					<button
						type="button"
						onclick={reset}
						class="inline-flex h-10 items-center justify-center gap-1 border border-rule px-3 text-[10px] text-ink-soft transition-colors hover:text-ink"
					>
						Clear filters
						<X class="size-3" />
					</button>
				{/if}
			</div>
		</div>

		<div class="mt-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
			<p class="text-[12px] text-ink-soft" aria-live="polite">
				<span class="font-medium text-ink">{results.length}</span>
				{results.length === 1 ? 'record' : 'records'} · {linkedResults} linked
			</p>
			<p class="text-[10px] text-ink-soft">Every linked row opens its source in a new tab.</p>
		</div>

		<div class="mt-4 border-t border-rule">
			{#each results as document (document.id)}
				<DocumentRow
					{document}
					accent={program.accent}
					soft={program.accentSoft}
					context={contextFor(document)}
				/>
			{:else}
				<div class="border border-dashed border-ink/25 bg-salt p-8 text-center">
					<p class="font-display text-2xl font-semibold tracking-[-0.03em]">No matching records.</p>
					<p class="mx-auto mt-2 max-w-md text-[12px] leading-relaxed text-ink-soft">
						Try a shorter keyword, choose a different section or area, or clear the filters.
					</p>
					<button
						type="button"
						onclick={reset}
						class="mt-5 inline-flex h-9 items-center justify-center bg-ink px-4 text-[11px] font-medium text-paper transition-colors hover:bg-ink-soft"
					>
						Clear filters
					</button>
				</div>
			{/each}
		</div>
	</div>
</section>
