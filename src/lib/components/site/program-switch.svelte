<script lang="ts">
	import { programs } from '$lib/data/accreditation';
	import type { ProgramSlug } from '$lib/data/types';
	import { cn } from '$lib/utils';

	let {
		active,
		class: className = ''
	}: {
		active: ProgramSlug;
		class?: string;
	} = $props();
</script>

<div class={cn('inline-flex items-center border border-rule bg-paper p-1', className)}>
	{#each programs as program (program.slug)}
		<a
			href={`/programs/${program.slug}`}
			class={cn(
				'inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium transition-colors',
				active === program.slug ? 'text-white' : 'text-ink-soft hover:text-ink'
			)}
			style={active === program.slug ? `background:${program.accent}` : ''}
			aria-current={active === program.slug ? 'page' : undefined}
		>
			<span
				class="size-1.5"
				style:background={active === program.slug ? '#F8FAF5' : program.accent}
				aria-hidden="true"
			></span>
			{program.code}
		</a>
	{/each}
</div>
