<script lang="ts">
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import { countLinked } from '$lib/data/accreditation';
	import type { Program } from '$lib/data/types';
	import { pad2 } from '$lib/format';
	import { cn } from '$lib/utils';

	let {
		program,
		class: className = ''
	}: {
		program: Program;
		class?: string;
	} = $props();
</script>

<div
	class={cn('w-full', className)}
	style:--area-accent={program.accent}
	style:--area-soft={program.accentSoft}
>
	<div
		class="hidden grid-cols-[3rem_1fr_9rem_7rem] items-center gap-4 border-b border-ink/20 pb-2 font-mono text-[9px] text-ink-soft sm:grid"
	>
		<span>Area</span>
		<span>Record</span>
		<span>Evidence</span>
		<span class="text-right">Open</span>
	</div>

	{#each program.areas as area (area.number)}
		{@const linked = countLinked(area.documents)}
		{@const total = area.documents.length}
		<a
			href={`/programs/${program.slug}/areas/${area.slug}`}
			class="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-b border-rule py-4 transition-colors hover:bg-[var(--area-soft)] sm:grid-cols-[3rem_1fr_9rem_7rem] sm:gap-4"
			aria-label={`Area ${area.number}: ${area.title}`}
		>
			<span class="font-mono text-[11px] text-ink-soft">{pad2(area.number)}</span>

			<span class="min-w-0">
				<span class="block font-display text-[17px] font-semibold leading-tight tracking-[-0.02em] text-ink">
					{area.shortTitle}
				</span>
				<span class="mt-0.5 block truncate text-[11px] text-ink-soft">{area.title}</span>
				<span class="mt-2 flex h-0.5 w-full overflow-hidden bg-ink/10 sm:hidden" aria-hidden="true">
					<span
						class="h-full"
						style:width={`${total ? (linked / total) * 100 : 0}%`}
						style:background={program.accent}
					></span>
				</span>
			</span>

			<span class="hidden sm:block">
				<span class="block font-mono text-[10px] text-ink-soft">{linked}/{total} linked</span>
				<span class="mt-2 flex h-0.5 w-full overflow-hidden bg-ink/10" aria-hidden="true">
					<span
						class="h-full"
						style:width={`${total ? (linked / total) * 100 : 0}%`}
						style:background={program.accent}
					></span>
				</span>
			</span>

			<span class="flex items-center justify-end gap-2 text-[10px] font-medium text-ink-soft transition-colors group-hover:text-ink">
				<span class="hidden sm:inline">Open</span>
				<ArrowUpRight class="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
			</span>
		</a>
	{/each}
</div>
