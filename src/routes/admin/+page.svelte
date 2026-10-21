<script lang="ts">
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import Type from '@lucide/svelte/icons/type';
	import { formatDate } from '$lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const cards = $derived([
		{ label: 'Content blocks', value: data.counts.blocks, href: '/admin/content' },
		{ label: 'Areas', value: data.counts.areas, href: null },
		{ label: 'Documents', value: data.counts.documents, href: null }
	]);
</script>

<svelte:head>
	<title>Overview · AACCUP Admin</title>
</svelte:head>

<div class="flex flex-col gap-6 border-b border-rule pb-6 sm:flex-row sm:items-end sm:justify-between">
	<div>
		<p class="font-mono text-[9px] text-ink-soft">Admin · {data.profile?.role ?? 'user'}</p>
		<h1 class="mt-3 font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-[0.96] tracking-[-0.05em]">
			The content desk.
		</h1>
		<p class="mt-3 max-w-xl text-[12px] leading-relaxed text-ink-soft">
			Welcome, {data.profile?.full_name || data.user?.email}. This is the Phase 1 admin. The content editor and carousel uploader are next.
		</p>
	</div>
	<a
		href="/"
		class="inline-flex w-fit items-center gap-1.5 border-b border-ink pb-1 text-[10px] font-medium text-ink"
	>
		View the public site
		<ArrowUpRight class="size-3.5" />
	</a>
</div>

<div class="mt-8 grid gap-4 sm:grid-cols-3">
	{#each cards as card (card.label)}
		<div class="border border-rule bg-paper p-5">
			<p class="font-mono text-[9px] text-ink-soft">{card.label}</p>
			<p class="mt-3 font-display text-[40px] font-semibold leading-none tracking-[-0.05em]">{card.value}</p>
			{#if card.href}
				<a href={card.href} class="mt-4 inline-flex items-center gap-1.5 text-[10px] font-medium text-ink">
					Open
					<ArrowUpRight class="size-3" />
				</a>
			{:else}
				<p class="mt-4 text-[9px] text-ink-soft">Phase 2</p>
			{/if}
		</div>
	{/each}
</div>

<div class="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
	<div class="border border-rule bg-paper">
		<div class="flex items-center justify-between border-b border-rule px-5 py-4">
			<h2 class="font-display text-[18px] font-semibold tracking-[-0.03em]">Recently updated</h2>
			<a href="/admin/content" class="text-[10px] text-ink-soft hover:text-ink">View all</a>
		</div>
		{#if data.recent.length === 0}
			<p class="p-5 text-[11px] text-ink-soft">No content blocks yet.</p>
		{:else}
			<ul class="divide-y divide-rule">
				{#each data.recent as block (block.key)}
					<li class="flex items-center justify-between gap-4 px-5 py-3">
						<div class="min-w-0">
							<p class="truncate text-[12px] font-medium">{block.label}</p>
							<p class="mt-0.5 font-mono text-[8px] text-ink-soft">{block.key}</p>
						</div>
						<div class="text-right">
							<span class="border border-rule px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.06em]">
								{block.status}
							</span>
							<p class="mt-1 text-[8px] text-ink-soft">{formatDate(block.updated_at?.slice(0, 10))}</p>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<div class="border border-rule bg-ink p-5 text-paper">
		<Type class="size-5 text-paper/50" />
		<h2 class="mt-4 font-display text-[20px] font-semibold tracking-[-0.03em]">Phase 1 tools</h2>
		<ul class="mt-4 space-y-3 text-[11px] leading-relaxed text-paper/60">
			<li class="flex gap-2"><span class="text-paper/30">01</span> Content list and status</li>
			<li class="flex gap-2"><span class="text-paper/30">02</span> Carousel upload and reorder</li>
			<li class="flex gap-2"><span class="text-paper/30">03</span> Draft → review → publish</li>
		</ul>
		<p class="mt-5 text-[9px] leading-relaxed text-paper/35">
			The login session and role guard are live. The editing forms are the next build.
		</p>
	</div>
</div>
