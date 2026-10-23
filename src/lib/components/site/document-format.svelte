<script lang="ts">
	import { formatLabel } from '#lib/format.js';
	import { cn } from '#lib/utils.js';

	let {
		format,
		class: className = ''
	}: {
		format: string;
		class?: string;
	} = $props();
</script>

<span
	class={cn(
		'inline-flex h-9 min-w-11 items-center justify-center border border-rule bg-salt px-2 font-mono text-[10px] font-medium tracking-[0.08em] text-ink-soft',
		className
	)}
	aria-hidden="true"
>
	{formatLabel(format)}
</span>
