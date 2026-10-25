<script lang="ts">
	import { page } from '$app/state';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import FileText from '@lucide/svelte/icons/file-text';
	import FolderOpen from '@lucide/svelte/icons/folder-open';
	import PageHeader from '#lib/components/admin/page-header.svelte';
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

<nav aria-label="Breadcrumb">
	<ol class="flex flex-wrap items-center gap-1 text-[13px] text-ink-soft">
		{#each crumbs as crumb, index (index)}
			<li class="flex items-center gap-1">
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

<div class="mt-2">
	{#if deep}
		<!-- Deeper pages carry their own big title; the program stays as a smaller line above the tabs. -->
		<p class="border-b border-ink/15 pb-4 font-display text-[20px] font-semibold tracking-[-0.03em]">{program.code} — {program.name}</p>
	{:else}
		<PageHeader eyebrow={`Program · /${program.slug}`} title={`${program.code} — ${program.name}`} />
	{/if}
</div>

<nav class="-mt-px mb-6 flex gap-1 overflow-x-auto" aria-label="Program sections">
	{#each tabs as item (item.label)}
		{@const Icon = item.icon}
		<a href={item.href} data-sveltekit-noscroll aria-current={item.active ? 'page' : undefined} class="inline-flex h-11 shrink-0 items-center gap-2 border-b-2 px-4 text-[14px] font-medium {item.active ? 'border-ink text-ink' : 'border-transparent text-ink-soft hover:text-ink'}">
			<Icon class="size-4" /> {item.label}
		</a>
	{/each}
</nav>

{@render children()}
