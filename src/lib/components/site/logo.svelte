<script lang="ts">
	import { cn } from '#lib/utils.js';
	import BrandMarks from './brand-marks.svelte';

	let {
		href = '/',
		label = 'AACCUP Accreditation',
		compact = false,
		class: className = ''
	}: {
		href?: string;
		label?: string;
		/** Hide the wordmark below the sm breakpoint. */
		compact?: boolean;
		class?: string;
	} = $props();
</script>

<a
	{href}
	class={cn('group inline-flex min-w-0 items-center gap-3 text-current transition-opacity hover:opacity-80', className)}
	aria-label={`CTU Moalboal ${label} — all programs`}
>
	<BrandMarks size={36} />
	<span class={cn('min-w-0 leading-none', compact && 'hidden sm:block')}>
		<span class="block truncate font-display text-[14px] font-semibold tracking-[-0.02em]">CTU Moalboal</span>
		<span class="mt-1 block truncate text-[11px] tracking-[0.02em] opacity-70">{label}</span>
	</span>
</a>
