<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		eyebrow,
		title,
		description,
		actions
	}: { eyebrow: string; title: string; description?: string; actions?: Snippet } = $props();
</script>

<header class="flex flex-col gap-5 border-b border-ink/15 pb-6 sm:flex-row sm:items-end sm:justify-between">
	<div class="min-w-0">
		<p class="font-mono text-[12px] text-ink-soft">{eyebrow}</p>
		<h1 class="mt-2 text-balance font-display text-[clamp(1.9rem,3.6vw,2.75rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-ink">
			{title}
		</h1>
		{#if description}
			<p class="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-soft">{description}</p>
		{/if}
	</div>
	{#if actions}
		<div class="flex shrink-0 flex-wrap gap-2">{@render actions()}</div>
	{/if}
</header>
