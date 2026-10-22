<script lang="ts">
	import { cn } from '$lib/utils';

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
	<span class="relative grid size-9 shrink-0 place-items-center border border-current/30">
		<span class="font-display text-[15px] font-semibold leading-none tracking-[-0.04em]">CM</span>
		<span class="absolute inset-x-1.5 bottom-1.5 h-px bg-current/25"></span>
	</span>
	<span class={cn('min-w-0 leading-none', compact && 'hidden sm:block')}>
		<span class="block truncate font-display text-[14px] font-semibold tracking-[-0.02em]">CTU Moalboal</span>
		<span class="mt-1 block truncate text-[11px] tracking-[0.02em] opacity-70">{label}</span>
	</span>
</a>
