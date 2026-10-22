<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import type { CtaContent } from '$lib/landing';

	// A band in the program colour; it stands apart from the white and grey blocks on purpose.
	let { content }: { content: CtaContent } = $props();

	const buttons = $derived((content.buttons ?? []).filter((button) => button.label && button.href));
	const external = (href: string) => /^https?:/.test(href);
</script>

<section class="on-program border-b border-rule bg-program text-program-contrast">
	<div class="mx-auto flex max-w-[1280px] flex-col gap-6 px-5 py-14 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
		<div class="max-w-2xl">
			{#if content.title}
				<h2 class="text-balance font-display text-[clamp(1.6rem,3.2vw,2.6rem)] font-semibold leading-[1.02] tracking-[-0.04em]">{content.title}</h2>
			{/if}
			{#if content.body}<p class="mt-3 text-pretty text-[15px] leading-relaxed opacity-90 sm:text-[16px]">{content.body}</p>{/if}
		</div>
		{#if buttons.length}
			<div class="flex shrink-0 flex-wrap gap-3">
				{#each buttons as button, index (index)}
					<a
						href={button.href}
						target={external(button.href) ? '_blank' : undefined}
						rel={external(button.href) ? 'noopener noreferrer' : undefined}
						class={index === 0
							? 'inline-flex h-12 items-center gap-2 bg-program-contrast px-5 text-[14px] font-semibold text-program transition-opacity hover:opacity-90'
							: 'inline-flex h-12 items-center gap-2 border border-program-contrast/50 px-5 text-[14px] font-medium transition-colors hover:bg-program-contrast/10'}
					>
						{button.label}
						{#if index === 0}<ArrowRight class="size-4" />{/if}
					</a>
				{/each}
			</div>
		{/if}
	</div>
</section>
