<script lang="ts">
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import type { Program } from '$lib/data/types';

	let { programs }: { programs: Program[] } = $props();
</script>

<div class="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:flex lg:items-start lg:justify-end">
	{#each programs as program, index (program.slug)}
		<a
			href={`/${program.slug}`}
			class="group relative flex min-h-[220px] min-w-0 flex-col justify-between overflow-hidden border border-white/15 p-5 text-white transition-[transform,border-color] duration-300 hover:-translate-y-1.5 hover:border-white/35 focus-visible:-translate-y-1.5 lg:h-[382px] lg:w-[204px] lg:even:translate-y-8 lg:even:hover:translate-y-6"
			style:--spine={program.accent}
			style:--spine-soft={program.accentSoft}
			aria-label={`Open the ${program.code} ${program.name} volume`}
		>
			<span class="absolute inset-y-0 left-0 w-2 bg-white/10" aria-hidden="true"></span>
			<span class="absolute inset-0 bg-[var(--spine)]" aria-hidden="true"></span>

			<span class="relative z-10 flex items-center justify-between font-mono text-[10px] text-white/55">
				<span>Vol. {String(index + 1).padStart(2, '0')}</span>
				<span>{program.level}</span>
			</span>

			<span class="relative z-10 mt-8 block">
				<span class="block font-display text-[58px] font-semibold leading-[0.8] tracking-[-0.06em] sm:text-[64px]">
					{program.code}
				</span>
				<span class="mt-4 block max-w-[26ch] text-[13px] leading-snug text-white/70">
					{program.name}
				</span>
			</span>

			<span class="relative z-10 mt-8 flex items-end justify-between gap-3 border-t border-white/15 pt-4">
				<span class="font-mono text-[10px] text-white/55">
					{program.areas.length} past · {program.currentVisitAreas.length} now
				</span>
				<span class="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/85">
					Open volume
					<ArrowUpRight class="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
				</span>
			</span>
		</a>
	{/each}
</div>
