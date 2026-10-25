<script lang="ts">
	import { parseInline, parseRich, type Inline } from '#lib/rich-text.js';

	// Body text with the editors' small formatting set (see rich-text.ts): paragraphs, lists, bold,
	// italic, links. Renders elements only, never raw HTML. The caller's wrapper sets size and spacing.
	let { text }: { text: string | undefined } = $props();

	const blocks = $derived(parseRich(text));
	const external = (href: string) => /^https?:\/\//.test(href);
</script>

{#snippet parts(list: Inline[])}
	{#each list as part, index (index)}
		{#if part.kind === 'bold'}
			<strong class="font-semibold text-ink">{@render parts(parseInline(part.text))}</strong>
		{:else if part.kind === 'italic'}
			<em>{part.text}</em>
		{:else if part.kind === 'link'}
			<a
				href={part.href}
				target={external(part.href) ? '_blank' : undefined}
				rel={external(part.href) ? 'noopener noreferrer' : undefined}
				class="font-medium text-program-ink underline decoration-program/40 underline-offset-[3px] transition-colors hover:decoration-program"
			>{part.text}</a>
		{:else}{part.text}{/if}
	{/each}
{/snippet}

{#each blocks as block, index (index)}
	{#if block.kind === 'p'}
		<p>{@render parts(block.parts)}</p>
	{:else if block.kind === 'ul'}
		<ul class="list-disc space-y-1.5 pl-5 marker:text-program">
			{#each block.items as item, i (i)}<li class="pl-1">{@render parts(item)}</li>{/each}
		</ul>
	{:else}
		<ol class="list-decimal space-y-1.5 pl-5 marker:font-medium marker:text-program">
			{#each block.items as item, i (i)}<li class="pl-1">{@render parts(item)}</li>{/each}
		</ol>
	{/if}
{/each}
