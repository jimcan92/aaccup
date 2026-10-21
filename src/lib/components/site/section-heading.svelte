<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		eyebrow,
		title,
		description,
		class: className = ''
	}: {
		eyebrow?: string;
		title: string;
		description?: string;
		class?: string;
	} = $props();
</script>

<div class={cn(className)}>
	{#if eyebrow}
		<div class="flex items-center gap-3 font-mono text-[10px] text-ink-soft">
			<span class="h-px w-6 bg-ink/25" aria-hidden="true"></span>
			<span>{eyebrow}</span>
		</div>
	{/if}
	<h2
		class="mt-4 max-w-3xl text-balance font-display text-[clamp(2rem,4vw,3.4rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-ink"
	>
		{title}
	</h2>
	{#if description}
		<p class="mt-4 max-w-2xl text-pretty text-[15px] leading-relaxed text-ink-soft sm:text-base">
			{description}
		</p>
	{/if}
</div>
