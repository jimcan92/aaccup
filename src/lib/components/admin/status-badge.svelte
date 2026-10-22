<script lang="ts">
	import { statusInfo } from '$lib/admin';
	import { cn } from '$lib/utils';

	let { status }: { status: string } = $props();
	const info = $derived(statusInfo[status] ?? { label: status, tone: 'neutral' as const });
</script>

<span
	class={cn(
		'inline-flex items-center gap-1.5 border px-2 py-0.5 text-[12px] font-medium whitespace-nowrap',
		info.tone === 'good' && 'border-bsfi/30 bg-bsfi-soft text-bsfi',
		info.tone === 'progress' && 'border-signal/50 bg-signal/10 text-ink',
		info.tone === 'neutral' && 'border-ink/20 bg-paper text-ink',
		info.tone === 'muted' && 'border-dashed border-ink/25 text-ink-soft'
	)}
>
	<span
		class={cn(
			'size-1.5 rounded-full',
			info.tone === 'good' && 'bg-bsfi',
			info.tone === 'progress' && 'bg-signal',
			info.tone === 'neutral' && 'bg-ink/50',
			info.tone === 'muted' && 'bg-ink/25'
		)}
		aria-hidden="true"
	></span>
	{info.label}
</span>
