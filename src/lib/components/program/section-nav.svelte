<script lang="ts">
	import { page } from '$app/state';
	import House from '@lucide/svelte/icons/house';
	import LayoutGrid from '@lucide/svelte/icons/layout-grid';
	import Search from '@lucide/svelte/icons/search';
	import { countLinked, dossierPath, sectionGroups, sectionsOf } from '#lib/data/accreditation.js';
	import type { Program, Section, Visit } from '#lib/data/types.js';
	import { pad2 } from '#lib/format.js';
	import { cn } from '#lib/utils.js';

	let {
		program,
		visit,
		base,
		onnavigate
	}: {
		program: Program;
		visit: Visit;
		base: string;
		/** Called when a link is chosen, so the mobile drawer can close. */
		onnavigate?: () => void;
	} = $props();

	const path = $derived(page.url.pathname);
	const home = $derived(`/${program.slug}`);
	const overview = $derived(dossierPath(program, visit));

	function groupLabel(kind: Section['kind']): string {
		if (kind === 'current') return `Current visit · ${visit.year}`;
		if (kind === 'previous') return visit.previousLabel ? `Previous visit · ${visit.previousLabel}` : 'Previous visit';
		return 'Common documents';
	}

	function itemNumber(section: Section): string {
		if (section.kind === 'common') return '—';
		return section.number ? pad2(section.number) : '··';
	}

	const linkClass = (active: boolean) =>
		cn(
			'group grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-2 border-l-2 py-2 pl-2.5 pr-2 text-[13px] leading-snug transition-colors',
			active
				? 'border-program bg-program-soft font-medium text-program-ink'
				: 'border-transparent text-ink-soft hover:border-program/40 hover:bg-paper hover:text-ink'
		);
</script>

<nav class="space-y-6 text-ink" aria-label={`${program.code} dossier`}>
	<div class="space-y-0.5">
		<a href={home} class={linkClass(path === home)} aria-current={path === home ? 'page' : undefined} onclick={onnavigate}>
			<House class="size-3.5" />
			<span>Program home</span>
			<span></span>
		</a>
		<a href={overview} class={linkClass(path === overview)} aria-current={path === overview ? 'page' : undefined} onclick={onnavigate}>
			<LayoutGrid class="size-3.5" />
			<span>All documents</span>
			<span></span>
		</a>
		<a
			href={`${base}/documents`}
			class={linkClass(path === `${base}/documents`)}
			aria-current={path === `${base}/documents` ? 'page' : undefined}
			onclick={onnavigate}
		>
			<Search class="size-3.5" />
			<span>Search documents</span>
			<span></span>
		</a>
	</div>

	{#each sectionGroups as group (group.kind)}
		{@const sections = sectionsOf(visit, group.kind)}
		{#if sections.length > 0}
			<div>
				<p class="mb-1.5 px-2.5 font-mono text-[11px] text-ink-soft">{groupLabel(group.kind)}</p>
				<ul class="space-y-0.5">
					{#each sections as section (section.slug)}
						{@const href = `${base}/${section.slug}`}
						{@const active = path === href}
						{@const linked = countLinked(section.documents)}
						<li>
							<a {href} class={linkClass(active)} aria-current={active ? 'page' : undefined} onclick={onnavigate}>
								<span class="font-mono text-[11px] opacity-70">{itemNumber(section)}</span>
								<span class="truncate">{section.kind === 'previous' && section.number ? section.shortTitle : section.title}</span>
								<span
									class={cn(
										'font-mono text-[10px] tabular-nums',
										linked > 0 ? 'text-program' : 'opacity-60'
									)}
									aria-label={`${linked} linked`}
								>
									{linked || '–'}
								</span>
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	{/each}
</nav>
