<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import PageHeader from '$lib/components/admin/page-header.svelte';
	import StatusBadge from '$lib/components/admin/status-badge.svelte';
	import { roleInfo } from '$lib/admin';
	import { formatDate } from '$lib/format';
	import { themeStyle } from '$lib/theme';
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
			href="/admin/content"
			class="inline-flex h-10 items-center gap-2 bg-ink px-4 text-[13px] font-medium text-paper transition-colors hover:bg-ink-soft"
		>
			Edit site content
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
		{#each data.programs as program (program.slug)}
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
				<div class="border-t border-rule px-5 py-3">
					<a href={`/${program.slug}`} class="inline-flex items-center gap-1.5 text-[13px] font-medium text-program-ink hover:underline">
						Open the public dossier
						<ArrowUpRight class="size-3.5" />
					</a>
				</div>
			</li>
		{/each}
	</ul>
	<p class="mt-3 text-[12px] text-ink-soft">
		Program, visit, and document records are still read from the site code. Editing them here comes with the next phase.
	</p>
</section>

<section class="mt-12 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
	<div>
		<h2 class="font-display text-[22px] font-semibold tracking-[-0.03em]">Site content</h2>
		<ul class="mt-4 border-t border-rule">
			{#each data.blocks as block (block.id)}
				<li>
					<a
						href={`/admin/content/${block.id}`}
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
			<a href={`/admin/content/${block.id}`} class="mt-3 flex items-center justify-between gap-3 text-[13px] font-medium hover:underline">
				{block.label}
				<ArrowRight class="size-3.5" />
			</a>
		{/each}
	</aside>
</section>
