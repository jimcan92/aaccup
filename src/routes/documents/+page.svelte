<script lang="ts">
	import { onMount } from 'svelte';
	import Search from '@lucide/svelte/icons/search';
	import X from '@lucide/svelte/icons/x';
	import DocumentRow from '$lib/components/site/document-row.svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { documentIndex, documentKinds, programs } from '$lib/data/accreditation';
	import { site } from '$lib/data/site';
	import type { IndexedDocument, ProgramSlug } from '$lib/data/types';
	import { kindLabel, pad2 } from '$lib/format';

	type ProgramFilter = ProgramSlug | 'all';

	const allDocuments = documentIndex().sort((a, b) => {
		if (a.status !== b.status) return a.status === 'linked' ? -1 : 1;
		if (a.programCode !== b.programCode) return a.programCode.localeCompare(b.programCode);
		return (a.areaNumber ?? 0) - (b.areaNumber ?? 0);
	});
	const areaOptions = programs[0].areas;

	let q = $state('');
	let programFilter = $state<ProgramFilter>('all');
	let areaFilter = $state('all');
	let kindFilter = $state('all');
	let searchInput = $state<HTMLInputElement | null>(null);
	let ready = $state(false);

	onMount(() => {
		const params = new URLSearchParams(window.location.search);
		const program = params.get('program');

		q = params.get('q') ?? '';
		programFilter = program === 'bsie' || program === 'bsfi' ? program : 'all';
		areaFilter = params.get('area') ?? 'all';
		kindFilter = params.get('kind') ?? 'all';
		ready = true;
	});

	const normalizedQuery = $derived(q.trim().toLowerCase());
	const hasFilters = $derived(
		q.trim() !== '' || programFilter !== 'all' || areaFilter !== 'all' || kindFilter !== 'all'
	);

	const results = $derived.by(() => {
		return allDocuments.filter((document) => {
			if (
				programFilter !== 'all' &&
				document.scope !== 'institutional' &&
				document.programSlug !== programFilter
			) {
				return false;
			}

			if (areaFilter !== 'all' && document.areaNumber !== Number(areaFilter)) {
				return false;
			}

			if (kindFilter !== 'all' && document.kind !== kindFilter) {
				return false;
			}

			if (!normalizedQuery) {
				return true;
			}

			const haystack = [
				document.title,
				document.note,
				document.programCode,
				document.programName,
				document.areaTitle,
				document.areaShortTitle,
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
		if (programFilter !== 'all') params.set('program', programFilter);
		if (areaFilter !== 'all') params.set('area', areaFilter);
		if (kindFilter !== 'all') params.set('kind', kindFilter);

		const query = params.toString();
		history.replaceState(null, '', query ? `/documents?${query}` : '/documents');
	});

	function reset() {
		q = '';
		programFilter = 'all';
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
		if (document.scope === 'institutional') return 'Institutional record';
		if (document.scope === 'program') return `${document.programCode} · Program-wide`;
		return `${document.programCode} · Area ${pad2(document.areaNumber ?? 0)} ${document.areaShortTitle ?? ''}`;
	}

	function accentFor(document: IndexedDocument): string {
		return programs.find((program) => program.slug === document.programSlug)?.accent ?? '#082A2C';
	}

	function softFor(document: IndexedDocument): string {
		return programs.find((program) => program.slug === document.programSlug)?.accentSoft ?? '#E3E9E1';
	}
</script>

<svelte:head>
	<title>Find a document · AACCUP Level III · CTU Moalboal</title>
	<meta
		name="description"
		content="Search every linked evidence document across the BSIE and BSFI AACCUP Level III dossiers at CTU Moalboal."
	/>
</svelte:head>

<svelte:window onkeydown={handleShortcut} />

<section class="border-b border-rule bg-salt">
	<div class="mx-auto max-w-[1280px] px-5 py-12 sm:px-8 lg:py-16">
		<div class="flex items-center gap-3 font-mono text-[10px] text-ink-soft">
			<span class="h-px w-6 bg-ink/25" aria-hidden="true"></span>
			<span>Document index</span>
		</div>
		<h1
			class="mt-4 max-w-3xl text-balance font-display text-[clamp(2.6rem,6vw,5.2rem)] font-semibold leading-[0.9] tracking-[-0.06em]"
		>
			Find the evidence.
		</h1>
		<p class="mt-4 max-w-2xl text-[14px] leading-relaxed text-ink-soft sm:text-[15px]">
			Search the titles and notes of every record in both volumes. Filters narrow the list by program, area, or document type. Press <kbd class="border border-ink/20 bg-paper px-1.5 py-0.5 font-mono text-[10px]">/</kbd> to jump to search.
		</p>
	</div>
</section>

<section class="bg-paper">
	<div class="mx-auto max-w-[1280px] px-5 py-8 sm:px-8 lg:py-10">
		<div class="border border-rule bg-salt p-4 sm:p-5">
			<div class="grid gap-3 md:grid-cols-[1fr_12rem_13rem]">
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

				<Select.Root type="single" bind:value={areaFilter}>
					<Select.Trigger
						class="h-11 w-full rounded-none border-rule bg-paper px-3 text-[12px] shadow-none"
						aria-label="Filter by area"
					>
						{areaFilter === 'all' ? 'All areas' : `Area ${areaFilter}`}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="all">All areas</Select.Item>
						{#each areaOptions as area (area.number)}
							<Select.Item value={String(area.number)}>
								Area {area.number} — {area.shortTitle}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>

				<Select.Root type="single" bind:value={kindFilter}>
					<Select.Trigger
						class="h-11 w-full rounded-none border-rule bg-paper px-3 text-[12px] shadow-none"
						aria-label="Filter by document type"
					>
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

			<div class="mt-4 flex flex-wrap items-center gap-2">
				<span class="mr-1 font-mono text-[9px] text-ink-soft">Program</span>
				<button
					type="button"
					onclick={() => (programFilter = 'all')}
					class="border px-2.5 py-1 text-[10px] font-medium transition-colors"
					class:border-ink={programFilter === 'all'}
					class:bg-ink={programFilter === 'all'}
					class:text-paper={programFilter === 'all'}
					class:border-rule={programFilter !== 'all'}
					class:text-ink-soft={programFilter !== 'all'}
					aria-pressed={programFilter === 'all'}
				>
					All
				</button>
				{#each programs as program (program.slug)}
					<button
						type="button"
						onclick={() => (programFilter = program.slug)}
						class="inline-flex items-center gap-1.5 border px-2.5 py-1 text-[10px] font-medium transition-colors"
						class:border-transparent={programFilter === program.slug}
						class:text-white={programFilter === program.slug}
						class:border-rule={programFilter !== program.slug}
						class:text-ink-soft={programFilter !== program.slug}
						style={programFilter === program.slug ? `background:${program.accent}` : ''}
						aria-pressed={programFilter === program.slug}
					>
						<span
							class="size-1.5"
							style:background={programFilter === program.slug ? '#F8FAF5' : program.accent}
							aria-hidden="true"
						></span>
						{program.code}
					</button>
				{/each}

				{#if hasFilters}
					<button
						type="button"
						onclick={reset}
						class="ml-auto inline-flex items-center gap-1 text-[10px] text-ink-soft underline-offset-4 hover:text-ink hover:underline"
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
			<p class="text-[10px] text-ink-soft">Every linked row opens Google Drive in a new tab.</p>
		</div>

		<div class="mt-4 border-t border-rule">
			{#each results as document (document.id)}
				<DocumentRow
					{document}
					accent={accentFor(document)}
					soft={softFor(document)}
					context={contextFor(document)}
				/>
			{:else}
				<div class="border border-dashed border-ink/25 bg-salt p-8 text-center">
					<p class="font-display text-2xl font-semibold tracking-[-0.03em]">No matching records.</p>
					<p class="mx-auto mt-2 max-w-md text-[12px] leading-relaxed text-ink-soft">
						Try a shorter keyword, choose a different area, or clear the filters to see the full index.
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

		<p class="mt-8 text-[10px] leading-relaxed text-ink-soft">{site.driveNote}</p>
	</div>
</section>
