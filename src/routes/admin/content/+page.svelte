<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import PageHeader from '$lib/components/admin/page-header.svelte';
	import StatusBadge from '$lib/components/admin/status-badge.svelte';
	import { formatDate } from '$lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	function preview(value: string | null | undefined) {
		if (!value) return '—';
		return value.length > 140 ? `${value.slice(0, 140)}…` : value;
	}
</script>

<svelte:head>
	<title>Site content · AACCUP Desk</title>
</svelte:head>

<PageHeader
	eyebrow="Site content"
	title="The words around the record"
	description="The site title, description, and footer contact line. Open a block to edit it next to a live preview. Drafts stay private until a focal person or admin publishes them."
/>

{#if data.error}
	<div class="mt-6 border border-destructive/30 bg-paper p-4 text-[13px] text-destructive" role="alert">
		{data.error}
	</div>
{/if}

<div class="mt-8 space-y-10">
	{#each data.groups as group (group.name)}
		<section>
			<div class="flex items-end justify-between border-b border-ink/20 pb-2">
				<h2 class="font-display text-[20px] font-semibold tracking-[-0.03em]">{group.name}</h2>
				<span class="font-mono text-[12px] text-ink-soft">{group.items.length} {group.items.length === 1 ? 'block' : 'blocks'}</span>
			</div>

			<ul>
				{#each group.items as block (block.key)}
					<li>
						<a
							href={`/admin/content/${block.id}`}
							class="group grid gap-3 border-b border-rule px-1 py-4 transition-colors hover:bg-paper sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-6 sm:px-3"
						>
							<div class="min-w-0">
								<p class="text-[15px] font-medium text-ink">{block.label}</p>
								<p class="mt-1 line-clamp-2 max-w-2xl text-[13px] leading-relaxed text-ink-soft">
									{preview(block.published_value ?? block.draft_value)}
								</p>
								<p class="mt-1.5 font-mono text-[11px] text-ink-soft">{block.key}</p>
							</div>
							<div class="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1.5">
								<StatusBadge status={block.status} />
								<span class="text-[12px] text-ink-soft">{formatDate(block.updated_at?.slice(0, 10))}</span>
							</div>
							<span class="hidden items-center gap-1.5 text-[13px] font-medium text-ink sm:inline-flex">
								Edit
								<ArrowRight class="size-4 transition-transform group-hover:translate-x-0.5" />
							</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{:else}
		<div class="border border-dashed border-ink/30 bg-paper p-8 text-center">
			<p class="font-display text-xl font-semibold tracking-[-0.03em]">No content blocks.</p>
			<p class="mt-2 text-[13px] text-ink-soft">Run the Supabase migrations to seed the editable copy.</p>
		</div>
	{/each}
</div>
