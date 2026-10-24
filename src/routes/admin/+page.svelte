<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import PageHeader from '#lib/components/admin/page-header.svelte';
	import StatusBadge from '#lib/components/admin/status-badge.svelte';
	import { roleInfo } from '#lib/admin.js';
	import { formatDate } from '#lib/format.js';
	import { themeStyle } from '#lib/theme.js';
	import { fresh } from '#lib/fresh-link.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const firstName = $derived((data.staff?.full_name || data.staff?.email || '').split(/[\s@]/)[0]);
	const role = $derived(roleInfo[data.staff?.role ?? ''] ?? { label: data.staff?.role ?? '', description: '' });
	const waiting = $derived(data.blocks.filter((block) => block.status === 'in_review' || block.status === 'approved'));
	const groupLabel = { common: 'Common', current: 'Current visit', previous: 'Previous visit' } as const;
</script>

<svelte:head>
	<title>Overview · AACCUP Desk</title>
</svelte:head>

<PageHeader
	eyebrow={`${role.label} · AACCUP Desk`}
	title={firstName ? `Good to see you, ${firstName}.` : 'Overview'}
	description={role.description}
>
	{#snippet actions()}
		<a
			href="/admin/home"
			class="inline-flex h-10 items-center gap-2 bg-ink px-4 text-[13px] font-medium text-paper transition-colors hover:bg-ink-soft"
		>
			Edit home page
			<ArrowRight class="size-4" />
		</a>
	{/snippet}
</PageHeader>

<section class="mt-10" aria-labelledby="programs-heading">
	<div class="flex items-end justify-between gap-4">
		<h2 id="programs-heading" class="font-display text-[22px] font-semibold tracking-[-0.03em]">Programs</h2>
		<p class="font-mono text-[12px] text-ink-soft">Documents linked, active visit</p>
	</div>

	<ul class="mt-4 grid gap-4 md:grid-cols-2">
		{#each data.programs as program (program.id)}
			{@const pct = program.total ? Math.round((program.linked / program.total) * 100) : 0}
			<li class="program-scope border border-rule bg-paper" style={themeStyle(program.theme)}>
				<div class="flex items-start justify-between gap-4 border-t-4 border-program p-5">
					<div class="min-w-0">
						<p class="font-display text-[30px] font-semibold leading-none tracking-[-0.05em] text-program">{program.code}</p>
						<p class="mt-2 truncate text-[13px] text-ink-soft">{program.name}</p>
						<p class="mt-1 font-mono text-[12px] text-ink-soft">{program.visit}</p>
					</div>
					<div class="text-right">
						<p class="font-display text-[28px] font-semibold leading-none tracking-[-0.04em] text-program-ink">{pct}%</p>
						<p class="mt-1 font-mono text-[12px] text-ink-soft">{program.linked}/{program.total}</p>
					</div>
				</div>
				<div class="px-5">
					<div class="h-1.5 bg-program-soft" role="progressbar" aria-label={`${program.code} documents linked`} aria-valuemin={0} aria-valuemax={program.total} aria-valuenow={program.linked}>
						<div class="h-full bg-program" style:width={`${pct}%`}></div>
					</div>
				</div>
				<dl class="grid grid-cols-3 gap-2 px-5 py-4 text-[12px]">
					{#each program.groups as group (group.kind)}
						<div>
							<dt class="text-ink-soft">{groupLabel[group.kind]}</dt>
							<dd class="mt-0.5 font-mono text-ink">{group.linked}/{group.total}</dd>
						</div>
					{/each}
				</dl>
				<div class="flex flex-wrap items-center justify-between gap-3 border-t border-rule px-5 py-3">
					<a href={`/admin/programs/${program.id}`} class="inline-flex items-center gap-1.5 text-[13px] font-medium text-program-ink hover:underline">
						Manage {program.code}
						<ArrowRight class="size-3.5" />
					</a>
					{#if program.waiting}
						<span class="text-[12px] font-medium text-ink">{program.waiting} waiting for review</span>
					{/if}
					<a href={`/${program.slug}`} use:fresh class="inline-flex items-center gap-1.5 text-[13px] text-ink-soft hover:underline">
						Public page
						<ArrowUpRight class="size-3.5" />
					</a>
				</div>
			</li>
		{/each}
	</ul>
</section>

<section class="mt-12" aria-labelledby="links-heading">
	<div class="flex flex-wrap items-end justify-between gap-3">
		<h2 id="links-heading" class="font-display text-[22px] font-semibold tracking-[-0.03em]">Links to fix</h2>
		<p class="font-mono text-[12px] text-ink-soft">
			{data.linkIssues.length ? `${data.linkIssues.length} an evaluator cannot open` : 'Every link opens'}
		</p>
	</div>
	{#if data.linkIssues.length}
		<ul class="mt-4 border-t border-rule">
			{#each data.linkIssues.slice(0, 40) as issue (issue.id)}
				<li>
					<a href={`/admin/sections/${issue.areaId}`} class="grid gap-1 border-b border-rule px-1 py-3 transition-colors hover:bg-paper sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:px-3">
						<span class="min-w-0">
							<span class="block truncate text-[14px] font-medium text-ink">{issue.title}</span>
							<span class="block text-[12px] text-ink-soft">{issue.section}</span>
						</span>
						<span class="w-fit border border-destructive/40 bg-destructive/5 px-1.5 py-0.5 text-[12px] font-medium text-destructive">{issue.problem}</span>
					</a>
				</li>
			{/each}
		</ul>
		{#if data.linkIssues.length > 40}<p class="mt-2 text-[12px] text-ink-soft">And {data.linkIssues.length - 40} more. Fix these first; the list updates on every sync.</p>{/if}
		<p class="mt-3 text-[12px] leading-relaxed text-ink-soft">
			In Google Drive, share each file or its folder as <span class="font-medium text-ink">Anyone with the link — Viewer</span>, then sync the section.
			Sharing status is known only for files pulled in by Drive sync.
		</p>
	{:else}
		<p class="mt-3 border border-dashed border-ink/30 bg-paper p-4 text-[13px] text-ink-soft">No broken, private, or non-Drive links in the active visits.</p>
	{/if}
</section>

<section class="mt-12 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
	<div>
		<h2 class="font-display text-[22px] font-semibold tracking-[-0.03em]">Home page & site texts</h2>
		<ul class="mt-4 border-t border-rule">
			{#each data.blocks as block (block.id)}
				<li>
					<a
						href="/admin/home#site-texts"
						class="flex items-center justify-between gap-4 border-b border-rule px-1 py-3.5 transition-colors hover:bg-paper sm:px-3"
					>
						<span class="min-w-0">
							<span class="block truncate text-[14px] font-medium text-ink">{block.label}</span>
							<span class="block text-[12px] text-ink-soft">Updated {formatDate(block.updated_at?.slice(0, 10))}</span>
						</span>
						<StatusBadge status={block.status} />
					</a>
				</li>
			{:else}
				<li class="border-b border-rule py-6 text-[13px] text-ink-soft">No content blocks found.</li>
			{/each}
		</ul>
	</div>

	<aside class="h-fit border border-rule bg-paper p-5">
		<p class="font-mono text-[12px] text-ink-soft">Waiting for review</p>
		<p class="mt-2 font-display text-[40px] font-semibold leading-none tracking-[-0.05em]">{waiting.length}</p>
		<p class="mt-2 text-[13px] leading-relaxed text-ink-soft">
			{waiting.length === 0
				? 'Nothing is waiting. Drafts submitted by area chairs appear here.'
				: 'Blocks submitted for review. A focal person or admin can publish them.'}
		</p>
		{#each waiting as block (block.id)}
			<a href="/admin/home#site-texts" class="mt-3 flex items-center justify-between gap-3 text-[13px] font-medium hover:underline">
				{block.label}
				<ArrowRight class="size-3.5" />
			</a>
		{/each}
	</aside>
</section>
