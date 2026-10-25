<script lang="ts">
	import { page } from '$app/state';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import FileText from '@lucide/svelte/icons/file-text';
	import FolderOpen from '@lucide/svelte/icons/folder-open';
	import PageHeader from '#lib/components/admin/page-header.svelte';
	import ProgramBar from '#lib/components/admin/program-bar.svelte';
	import { documentsHref } from '#lib/admin-links.js';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	type Crumb = { label: string; href?: string };

	const program = $derived(data.header);
	// Visits and sections are subpages of Documents; each page names its own trail after the program.
	const inDocuments = $derived((page.route.id ?? '').startsWith('/admin/programs/[id]/documents'));
	const deep = $derived(inDocuments && page.route.id !== '/admin/programs/[id]/documents');
	const crumbs = $derived<Crumb[]>([
		{ label: 'All programs', href: '/admin/programs' },
		{ label: program.code, href: `/admin/programs/${program.id}` },
		...((page.data.crumbs as Crumb[] | undefined) ?? [])
	]);
	const tabs = $derived([
		{ label: 'Program page', href: `/admin/programs/${program.id}`, active: !inDocuments, icon: FileText },
		{ label: 'Documents', href: documentsHref(program.id), active: inDocuments, icon: FolderOpen }
	]);
</script>

<!--
	Two sticky rows: the breadcrumb at the top, and the tabs with the page's buttons under it.
	--sticky-offset is their height (plus the phone header), for the preview pane and scroll targets.
-->
<div class="[--sticky-offset:10.5rem] lg:[--sticky-offset:6.5rem]">
	<nav aria-label="Breadcrumb" class="sticky top-16 z-20 -mx-5 h-11 bg-salt/95 px-5 backdrop-blur sm:-mx-8 sm:px-8 lg:top-0">
		<ol class="flex h-full items-center gap-1 overflow-x-auto whitespace-nowrap text-[13px] text-ink-soft">
			{#each crumbs as crumb, index (index)}
				<li class="flex shrink-0 items-center gap-1">
					{#if index > 0}<ChevronRight class="size-3.5 shrink-0 opacity-60" />{/if}
					{#if crumb.href && index < crumbs.length - 1}
						<a href={crumb.href} class="inline-flex min-h-9 items-center hover:text-ink">{crumb.label}</a>
					{:else}
						<span class="inline-flex min-h-9 items-center font-medium text-ink" aria-current="page">{crumb.label}</span>
					{/if}
				</li>
			{/each}
		</ol>
	</nav>

	<div class="mt-1">
		{#if deep}
			<!-- Deeper pages carry their own big title; the program stays as a smaller line above the tabs. -->
			<p class="pb-4 font-display text-[20px] font-semibold tracking-[-0.03em]">{program.code} — {program.name}</p>
		{:else}
			<div class="[&>header]:border-b-0 [&>header]:pb-5">
				<PageHeader eyebrow={`Program · /${program.slug}`} title={`${program.code} — ${program.name}`} />
			</div>
		{/if}
	</div>

	<div class="sticky top-[6.75rem] z-10 -mx-5 mb-6 h-15 border-y border-rule bg-salt/95 px-5 backdrop-blur sm:-mx-8 sm:px-8 lg:top-11">
		<ProgramBar {tabs} />
	</div>

	{@render children()}
</div>
