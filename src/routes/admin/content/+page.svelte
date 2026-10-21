<script lang="ts">
	import Type from '@lucide/svelte/icons/type';
	import { formatDate } from '$lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	function preview(value: string | null | undefined) {
		if (!value) return '—';
		return value.length > 110 ? `${value.slice(0, 110)}…` : value;
	}
</script>

<svelte:head>
	<title>Content · AACCUP Admin</title>
</svelte:head>

<div class="border-b border-rule pb-6">
	<p class="font-mono text-[9px] text-ink-soft">Content blocks</p>
	<h1 class="mt-3 font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-[0.96] tracking-[-0.05em]">
		The editable copy.
	</h1>
	<p class="mt-3 max-w-2xl text-[12px] leading-relaxed text-ink-soft">
		VMGO, hero text, carousel JSON, and site wordings. The list is read-only in this build; the inline editor and publish controls are the next step.
	</p>
</div>

{#if data.error}
	<div class="mt-6 border border-destructive/30 bg-destructive/5 p-4 text-[11px] text-destructive">
		{data.error}
	</div>
{/if}

<div class="mt-8 space-y-8">
	{#each data.groups as group (group.name)}
		<section>
			<div class="flex items-center justify-between border-b border-ink/20 pb-2">
				<h2 class="font-display text-[18px] font-semibold tracking-[-0.03em]">{group.name}</h2>
				<span class="font-mono text-[9px] text-ink-soft">{group.items.length} blocks</span>
			</div>

			<div class="divide-y divide-rule">
				{#each group.items as block (block.key)}
					<div class="grid gap-3 py-4 sm:grid-cols-[1fr_7rem_7rem] sm:items-start">
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2">
								<p class="text-[12px] font-medium">{block.label}</p>
								<span class="border border-rule px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.06em]">
									{block.type}
								</span>
							</div>
							<p class="mt-1 font-mono text-[8px] text-ink-soft">{block.key}</p>
							<p class="mt-2 max-w-2xl text-[11px] leading-relaxed text-ink-soft">
								{preview(block.published_value ?? block.draft_value)}
							</p>
						</div>
						<div>
							<span class="border border-rule px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.06em]">
								{block.status}
							</span>
							<p class="mt-1 text-[8px] text-ink-soft">{formatDate(block.updated_at?.slice(0, 10))}</p>
						</div>
						<div class="flex items-start justify-end">
							<Type class="size-4 text-ink-soft" />
						</div>
					</div>
				{/each}
			</div>
		</section>
	{:else}
		<div class="border border-dashed border-ink/25 bg-paper p-8 text-center">
			<p class="font-display text-xl font-semibold tracking-[-0.03em]">No content blocks.</p>
			<p class="mt-2 text-[11px] text-ink-soft">Run the migration to seed the editable copy.</p>
		</div>
	{/each}
</div>
