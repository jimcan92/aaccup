<script lang="ts">
	import type { Snippet } from 'svelte';

	// Shared frame for landing blocks: background tone, page width, and an optional heading.
	let { title, tone = 'paper', narrow = false, children }: { title?: string; tone?: 'paper' | 'salt'; narrow?: boolean; children: Snippet } = $props();

	const id = $props.id();
	const background = { paper: 'bg-paper', salt: 'bg-salt' };
</script>

<section class="border-b border-rule {background[tone]}" aria-labelledby={title ? `${id}-heading` : undefined}>
	<div class="mx-auto max-w-[1280px] px-5 py-14 sm:px-8">
		<div class={narrow ? 'max-w-3xl' : ''}>
			{#if title}
				<h2 id={`${id}-heading`} class="mb-8 text-balance font-display text-[clamp(1.6rem,3.2vw,2.6rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-ink">{title}</h2>
			{/if}
			{@render children()}
		</div>
	</div>
</section>
