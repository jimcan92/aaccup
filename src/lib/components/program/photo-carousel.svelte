<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Pause from '@lucide/svelte/icons/pause';
	import Play from '@lucide/svelte/icons/play';
	import { MediaQuery } from 'svelte/reactivity';
	import { imageSrc } from '$lib/image-url';
	import type { GalleryItem } from '$lib/landing';

	let {
		items,
		title,
		tone = 'paper',
		onopen
	}: { items: GalleryItem[]; title?: string; tone?: 'paper' | 'salt'; onopen: (index: number) => void } = $props();

	const reducedMotion = new MediaQuery('prefers-reduced-motion: reduce', false);

	let index = $state(0);
	let paused = $state(false);
	// Pauses while the pointer or keyboard focus is on the carousel.
	let hovering = $state(false);
	let focused = $state(false);

	const playing = $derived(items.length > 1 && !paused && !hovering && !focused && !reducedMotion.current);

	$effect(() => {
		if (!playing) return;
		const timer = setInterval(() => (index = (index + 1) % items.length), 6000);
		return () => clearInterval(timer);
	});

	function go(next: number) {
		index = (next + items.length) % items.length;
	}
</script>

<section class="border-b border-rule {tone === 'salt' ? 'bg-salt' : 'bg-paper'}" aria-roledescription="carousel" aria-label={title || 'Photos'}>
	<div class="mx-auto max-w-[1280px] px-5 py-12 sm:px-8">
		{#if title}<h2 class="font-display text-[clamp(1.4rem,2.6vw,1.9rem)] font-semibold tracking-[-0.035em]">{title}</h2>{/if}

		<!-- Pointer, focus and arrow-key events come from the buttons inside; listening here pauses the slideshow. -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="relative mt-6 overflow-hidden bg-ink"
			role="group"
			onmouseenter={() => (hovering = true)}
			onmouseleave={() => (hovering = false)}
			onfocusin={() => (focused = true)}
			onfocusout={() => (focused = false)}
			onkeydown={(event) => {
				if (event.key === 'ArrowRight') go(index + 1);
				if (event.key === 'ArrowLeft') go(index - 1);
			}}
		>
			<div class="relative aspect-[4/3] sm:aspect-[16/7]">
				{#each items as item, i (i)}
					<button
						type="button"
						class="absolute inset-0 block h-full w-full transition-opacity duration-700 {i === index ? 'opacity-100' : 'pointer-events-none opacity-0'}"
						onclick={() => onopen(i)}
						aria-hidden={i !== index}
						tabindex={i === index ? 0 : -1}
						aria-label={`Photo ${i + 1} of ${items.length}: ${item.caption || item.alt}. Open larger`}
					>
						<img
							src={imageSrc(item.src, 2000)}
							alt={item.alt}
							loading={i === 0 ? 'eager' : 'lazy'}
							class="h-full w-full object-cover"
						/>
					</button>
				{/each}

				{#if items[index]?.caption}
					<p class="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-5 pb-12 pt-16 text-[15px] font-medium text-white sm:px-8 sm:text-[17px]" aria-live={playing ? 'off' : 'polite'}>
						{items[index].caption}
					</p>
				{/if}
			</div>

			{#if items.length > 1}
				<button type="button" onclick={() => go(index - 1)} class="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center bg-black/45 text-white transition-colors hover:bg-black/70" aria-label="Previous photo">
					<ChevronLeft class="size-5" />
				</button>
				<button type="button" onclick={() => go(index + 1)} class="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center bg-black/45 text-white transition-colors hover:bg-black/70" aria-label="Next photo">
					<ChevronRight class="size-5" />
				</button>

				<div class="absolute bottom-3 left-5 right-5 flex items-center justify-between gap-3 sm:left-8 sm:right-8">
					<div class="flex flex-wrap gap-1.5">
						{#each items as _, i (i)}
							<button
								type="button"
								onclick={() => go(i)}
								class="h-2 transition-all {i === index ? 'w-7 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}"
								aria-label={`Show photo ${i + 1}`}
								aria-current={i === index ? 'true' : undefined}
							></button>
						{/each}
					</div>
					{#if !reducedMotion.current}
						<button type="button" onclick={() => (paused = !paused)} class="grid size-8 place-items-center bg-black/45 text-white hover:bg-black/70" aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}>
							{#if paused}<Play class="size-3.5" />{:else}<Pause class="size-3.5" />{/if}
						</button>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</section>
