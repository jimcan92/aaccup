<script lang="ts">
	import type { VmgoContent } from '#lib/landing.js';
	import Section from './section.svelte';

	let { content, tone }: { content: VmgoContent; tone: 'paper' | 'salt' } = $props();

	const statements = $derived(
		[
			{ label: 'Vision', text: content.vision },
			{ label: 'Mission', text: content.mission }
		].filter((statement) => statement.text)
	);
	const lists = $derived(
		[
			{ label: 'Goals', items: content.goals ?? [] },
			{ label: 'Program objectives', items: content.objectives ?? [] }
		].filter((group) => group.items.length)
	);
</script>

<Section title={content.title} {tone}>
	{#if statements.length}
		<div class="grid gap-4 {statements.length > 1 ? 'md:grid-cols-2' : ''}">
			{#each statements as statement (statement.label)}
				<div class="border-t-4 border-program bg-paper p-6 shadow-[0_0_0_1px_var(--color-rule)] sm:p-8">
					<h3 class="font-mono text-[12px] uppercase tracking-[0.12em] text-program">{statement.label}</h3>
					<p class="mt-3 text-pretty font-display text-[clamp(1.15rem,2vw,1.45rem)] font-medium leading-snug tracking-[-0.02em] text-ink">{statement.text}</p>
				</div>
			{/each}
		</div>
	{/if}

	{#if lists.length}
		<div class="mt-10 grid gap-10 {lists.length > 1 ? 'md:grid-cols-2' : ''}">
			{#each lists as group (group.label)}
				<div>
					<h3 class="font-mono text-[12px] uppercase tracking-[0.12em] text-program">{group.label}</h3>
					<ol class="mt-4 space-y-3">
						{#each group.items as item, index (index)}
							<li class="grid grid-cols-[2rem_minmax(0,1fr)] gap-2 text-[15px] leading-relaxed text-ink-soft">
								<span class="font-display text-[17px] font-semibold leading-[1.55] text-program">{index + 1}</span>
								<span>{item}</span>
							</li>
						{/each}
					</ol>
				</div>
			{/each}
		</div>
	{/if}
</Section>
