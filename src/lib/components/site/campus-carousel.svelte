<script lang="ts">
	import { onMount } from 'svelte';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Pause from '@lucide/svelte/icons/pause';
	import Play from '@lucide/svelte/icons/play';
	import { campusUpdates, site } from '$lib/data/site';

	type Slide = {
		src: string;
		alt: string;
		caption: string;
		meta: string;
	};

	let { slides = campusUpdates }: { slides?: readonly Slide[] } = $props();

	let index = $state(0);
	let paused = $state(false);
	let reduced = $state(false);
	let timer: ReturnType<typeof setInterval> | null = null;

	const total = $derived(slides.length);

	function stop() {
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
	}

	function start() {
		stop();
		if (reduced || paused) return;
		timer = setInterval(() => {
			index = (index + 1) % total;
		}, 7000);
	}

	function go(nextIndex: number) {
		index = (nextIndex + total) % total;
		start();
	}

	function toggle() {
		paused = !paused;
		if (paused) stop();
		else start();
	}

	onMount(() => {
		reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (!reduced) start();

		return () => stop();
	});
</script>

<section class="border-b border-rule bg-paper" aria-labelledby="campus-updates-title">
	<div class="mx-auto max-w-[1280px] px-5 py-10 sm:px-8 lg:py-14">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<div class="flex items-center gap-3 font-mono text-[9px] text-ink-soft">
					<span class="h-px w-6 bg-ink/25" aria-hidden="true"></span>
					<span>From the campus</span>
				</div>
				<h2 id="campus-updates-title" class="mt-3 font-display text-[clamp(1.8rem,3.2vw,2.6rem)] font-semibold leading-[0.98] tracking-[-0.045em]">
					The campus in motion.
				</h2>
			</div>
			<a
				href={site.website}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex w-fit items-center gap-1.5 border-b border-ink pb-1 text-[10px] font-medium text-ink"
			>
				CTU Moalboal website
				<ChevronRight class="size-3.5" />
			</a>
		</div>

		<div
			class="relative mt-5 overflow-hidden border border-rule bg-ink"
			role="region"
			aria-roledescription="carousel"
			aria-label="Campus updates"
			onmouseenter={() => {
				paused = true;
				stop();
			}}
			onmouseleave={() => {
				paused = false;
				start();
			}}
			onfocusin={() => {
				paused = true;
				stop();
			}}
			onfocusout={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
					paused = false;
					start();
				}
			}}
		>
			<div class="relative h-[260px] sm:h-[340px] lg:h-[430px]">
				{#each slides as slide, slideIndex (slide.src)}
					<div
						class="absolute inset-0 transition-opacity duration-700"
						class:opacity-100={slideIndex === index}
						class:opacity-0={slideIndex !== index}
						aria-hidden={slideIndex !== index}
						role="group"
						aria-roledescription="slide"
						aria-label={`${slideIndex + 1} of ${total}`}
					>
						<img
							src={slide.src}
							alt={slide.alt}
							class="absolute inset-0 h-full w-full object-cover"
							loading={slideIndex === 0 ? 'eager' : 'lazy'}
							decoding="async"
							onerror={(event) => {
								(event.currentTarget as HTMLImageElement).style.opacity = '0';
							}}
						/>
						<div class="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-transparent"></div>
						<div class="absolute inset-x-0 bottom-0 p-5 sm:p-7">
							<p class="font-mono text-[9px] text-paper/55">{slide.meta}</p>
							<p class="mt-1.5 max-w-2xl text-balance font-display text-[clamp(1.35rem,2.6vw,2.4rem)] font-semibold leading-tight tracking-[-0.035em] text-paper">
								{slide.caption}
							</p>
						</div>
					</div>
				{/each}
			</div>

			<div class="flex items-center justify-between gap-4 border-t border-paper/10 bg-ink px-4 py-2.5">
				<div class="flex items-center gap-1.5">
					{#each slides as slide, slideIndex (slide.src)}
						<button
							type="button"
							onclick={() => go(slideIndex)}
							class="h-1 w-5 transition-all"
							style:background={slideIndex === index ? '#F8FAF5' : 'rgba(248,250,245,0.3)'}
							aria-label={`Go to slide ${slideIndex + 1}`}
							aria-current={slideIndex === index}
						></button>
					{/each}
				</div>

				<div class="flex items-center gap-1">
					<button
						type="button"
						onclick={() => go(index - 1)}
						class="grid size-8 place-items-center border border-paper/25 text-paper transition-colors hover:bg-paper hover:text-ink"
						aria-label="Previous slide"
					>
						<ChevronLeft class="size-4" />
					</button>
					<button
						type="button"
						onclick={toggle}
						class="grid size-8 place-items-center border border-paper/25 text-paper transition-colors hover:bg-paper hover:text-ink"
						aria-label={paused ? 'Play campus carousel' : 'Pause campus carousel'}
					>
						{#if paused}
							<Play class="size-3.5" />
						{:else}
							<Pause class="size-3.5" />
						{/if}
					</button>
					<button
						type="button"
						onclick={() => go(index + 1)}
						class="grid size-8 place-items-center border border-paper/25 text-paper transition-colors hover:bg-paper hover:text-ink"
						aria-label="Next slide"
					>
						<ChevronRight class="size-4" />
					</button>
				</div>
			</div>
		</div>

		<p class="mt-2 text-[9px] text-ink-soft">
			Campus updates and photos from the official CTU Moalboal page. Hover or focus to pause.
		</p>
	</div>
</section>
