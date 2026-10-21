<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		tone = 'light',
		class: className = ''
	}: {
		tone?: 'light' | 'dark';
		class?: string;
	} = $props();
</script>

<a
	href="/"
	class={cn(
		'group inline-flex items-center gap-3 transition-opacity hover:opacity-80',
		tone === 'dark' ? 'text-paper' : 'text-ink',
		className
	)}
	aria-label="CTU Moalboal AACCUP — home"
>
	<span class="relative grid size-9 shrink-0 place-items-center border border-current/25">
		<span class="font-display text-[15px] font-semibold leading-none tracking-[-0.04em]">CM</span>
		<span class="absolute inset-x-1.5 bottom-1.5 h-px bg-current/20"></span>
	</span>
	<span class="leading-none">
		<span class="block font-display text-[14px] font-semibold tracking-[-0.02em]">CTU Moalboal</span>
		<span class="mt-1 block text-[10px] tracking-[0.02em] text-current/55">AACCUP Level III</span>
	</span>
</a>
