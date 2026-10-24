<script lang="ts" module>
	import type { ComplianceStatus } from '#lib/data/types.js';

	export const complianceLabels: Record<ComplianceStatus, string> = {
		complied: 'Complied',
		partial: 'Partly complied',
		not_yet: 'Not yet complied'
	};
</script>

<script lang="ts">
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import type { Recommendation } from '#lib/data/types.js';

	/**
	 * The previous survey's recommendations for one area, each with the action taken, how far it
	 * is complied with, and its evidence. A table on wide screens, one card per row on phones.
	 */
	let { items }: { items: Recommendation[] } = $props();

	const counts = $derived(
		(['complied', 'partial', 'not_yet'] as const).map((status) => ({
			status,
			count: items.filter((item) => item.status === status).length
		}))
	);

	const chip: Record<ComplianceStatus, string> = {
		complied: 'border-program bg-program text-program-contrast',
		partial: 'border-program/50 bg-program-soft text-program-ink',
		not_yet: 'border-dashed border-ink/35 text-ink-soft'
	};

	const external = (href: string) => href.startsWith('https://');
</script>

{#snippet status(value: ComplianceStatus)}
	<span class="inline-block whitespace-nowrap border px-1.5 py-0.5 font-mono text-[11px] {chip[value]}">{complianceLabels[value]}</span>
{/snippet}

{#snippet evidence(item: Recommendation)}
	{#if item.evidenceUrl}
		<a
			href={item.evidenceUrl}
			target={external(item.evidenceUrl) ? '_blank' : undefined}
			rel={external(item.evidenceUrl) ? 'noopener noreferrer' : undefined}
			class="inline-flex items-center gap-1 whitespace-nowrap text-[12px] font-medium text-program hover:underline"
		>
			Evidence <ArrowUpRight class="size-3.5" />
		</a>
	{:else}
		<span class="font-mono text-[11px] text-ink-soft">—</span>
	{/if}
{/snippet}

<section class="mt-8" aria-labelledby="compliance-heading">
	<div class="flex flex-wrap items-end justify-between gap-3 border-b border-ink/20 pb-2">
		<h2 id="compliance-heading" class="font-display text-[20px] font-semibold tracking-[-0.03em] text-ink">Compliance with recommendations</h2>
		<p class="font-mono text-[12px] text-ink-soft">
			{#each counts as item, index (item.status)}{index ? ' · ' : ''}{item.count} {complianceLabels[item.status].toLowerCase()}{/each}
		</p>
	</div>

	<!-- Wide screens: one table row per recommendation. -->
	<table class="mt-3 hidden w-full border-collapse text-left text-[13px] md:table">
		<thead>
			<tr class="border-b border-rule font-mono text-[11px] text-ink-soft">
				<th scope="col" class="w-10 py-2 pr-3 font-normal">No.</th>
				<th scope="col" class="py-2 pr-4 font-normal">Recommendation</th>
				<th scope="col" class="py-2 pr-4 font-normal">Action taken</th>
				<th scope="col" class="py-2 pr-4 font-normal">Status</th>
				<th scope="col" class="py-2 font-normal"><span class="sr-only">Evidence</span></th>
			</tr>
		</thead>
		<tbody>
			{#each items as item (item.id)}
				<tr class="border-b border-rule align-top">
					<td class="py-3 pr-3 font-display text-[15px] font-semibold text-program">{item.number}</td>
					<td class="py-3 pr-4 leading-relaxed text-ink">{item.recommendation}</td>
					<td class="py-3 pr-4 leading-relaxed text-ink-soft">{item.actionTaken ?? '—'}</td>
					<td class="py-3 pr-4">{@render status(item.status)}</td>
					<td class="py-3 text-right">{@render evidence(item)}</td>
				</tr>
			{/each}
		</tbody>
	</table>

	<!-- Phones and tablets: one card per recommendation. -->
	<ol class="mt-3 space-y-3 md:hidden">
		{#each items as item (item.id)}
			<li class="border border-rule bg-paper p-4">
				<div class="flex items-start justify-between gap-3">
					<span class="font-display text-[17px] font-semibold text-program">{item.number}</span>
					{@render status(item.status)}
				</div>
				<p class="mt-2 text-[13px] leading-relaxed text-ink">{item.recommendation}</p>
				{#if item.actionTaken}
					<p class="mt-3 font-mono text-[11px] text-ink-soft">Action taken</p>
					<p class="mt-1 text-[13px] leading-relaxed text-ink-soft">{item.actionTaken}</p>
				{/if}
				{#if item.evidenceUrl}
					<div class="mt-3">{@render evidence(item)}</div>
				{/if}
			</li>
		{/each}
	</ol>
</section>
