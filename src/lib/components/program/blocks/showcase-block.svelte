<script lang="ts">
	import RichText from '#lib/components/site/rich-text.svelte';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Maximize2 from '@lucide/svelte/icons/maximize-2';
	import Pause from '@lucide/svelte/icons/pause';
	import Play from '@lucide/svelte/icons/play';
	import X from '@lucide/svelte/icons/x';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { MediaQuery } from 'svelte/reactivity';
	import { imageSrc } from '#lib/image-url.js';
	import type { ShowcaseContent } from '#lib/landing.js';
	import { reveal, stagger } from '#lib/motion.js';
	import ShowcaseIcon from './showcase-icon.svelte';

	// A system built by the program: words and features on one side, screenshots sliding in a browser frame on the other.
	let { content, tone }: { content: ShowcaseContent; tone: 'paper' | 'salt' } = $props();

	const id = $props.id();
	const background = { paper: 'bg-paper', salt: 'bg-salt' };
	const shots = $derived(content.shots ?? []);
	const features = $derived(content.features ?? []);
	const external = $derived(/^https?:/.test(content.button?.href ?? ''));

	const reducedMotion = new MediaQuery('prefers-reduced-motion: reduce', false);
	let index = $state(0);
	let paused = $state(false);
	let hovering = $state(false);
	let focused = $state(false);
	let large = $state(false);
	const playing = $derived(shots.length > 1 && !paused && !hovering && !focused && !large && !reducedMotion.current);

	$effect(() => {
		if (!playing) return;
		const timer = setInterval(() => (index = (index + 1) % shots.length), 5000);
		return () => clearInterval(timer);
	});

	function go(next: number) {
		if (shots.length) index = (next + shots.length) % shots.length;
	}

	// Swipe left or right on a phone.
	let startX: number | null = null;
	function swipeStart(event: PointerEvent) {
		if (event.pointerType !== 'mouse') startX = event.clientX;
	}
	function swipeEnd(event: PointerEvent) {
		if (startX === null) return;
		const distance = event.clientX - startX;
		startX = null;
		if (Math.abs(distance) > 40) go(index + (distance < 0 ? 1 : -1));
	}
</script>

<section class="relative overflow-hidden border-b border-rule {background[tone]}" aria-labelledby={content.title ? `${id}-heading` : undefined}>
	<!-- A soft wash of the program colour behind the frame. -->
	<div class="pointer-events-none absolute -top-40 size-[34rem] rounded-full bg-program/10 blur-3xl {content.side === 'right' ? '-left-40' : '-right-40'}" aria-hidden="true"></div>

	<div class="relative mx-auto grid max-w-[1280px] items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
		<div class={content.side === 'right' ? 'lg:order-2' : ''}>
			{#if content.eyebrow}
				<p class="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-program">
					<span class="size-1.5 rounded-full bg-program"></span>{content.eyebrow}
				</p>
			{/if}
			{#if content.title}
				<h2 id={`${id}-heading`} class="mt-3 text-balance font-display text-[clamp(1.7rem,3.4vw,2.8rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-ink">{content.title}</h2>
			{/if}
			{#if content.body}
				<div class="mt-4 max-w-[58ch] space-y-4 text-[15px] leading-relaxed text-ink-soft sm:text-[16px]"><RichText text={content.body} /></div>
			{/if}

			{#if features.length}
				<ul class="mt-8 grid gap-x-6 gap-y-5 sm:grid-cols-2">
					{#each features as feature, i (i)}
						<li class="flex gap-3" use:reveal={{ delay: stagger(i) }}>
							<span class="grid size-10 shrink-0 place-items-center bg-program/10 text-program"><ShowcaseIcon name={feature.icon} class="size-5" /></span>
							<span class="min-w-0">
								<span class="block text-[15px] font-semibold leading-snug text-ink">{feature.title}</span>
								{#if feature.text}<span class="mt-0.5 block text-[13.5px] leading-snug text-ink-soft">{feature.text}</span>{/if}
							</span>
						</li>
					{/each}
				</ul>
			{/if}

			{#if content.button?.label && content.button.href}
				<a
					href={content.button.href}
					target={external ? '_blank' : undefined}
					rel={external ? 'noopener noreferrer' : undefined}
					class="mt-8 inline-flex h-11 items-center gap-2 bg-program px-5 text-[14px] font-semibold text-program-contrast transition-opacity hover:opacity-90"
				>
					{content.button.label}
					<ArrowRight class="size-4" />
				</a>
			{/if}
		</div>

		<div class={content.side === 'right' ? 'lg:order-1' : ''}>
			<!-- Pointer, focus and arrow keys come from the controls inside; listening here pauses the slideshow. -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<figure
				class="overflow-hidden rounded-xl border border-ink/10 bg-paper shadow-[0_30px_80px_-30px_rgba(0,0,0,0.45)]"
				aria-roledescription="carousel"
				aria-label={content.title ? `Screenshots of ${content.title}` : 'Screenshots'}
				onmouseenter={() => (hovering = true)}
				onmouseleave={() => (hovering = false)}
				onfocusin={() => (focused = true)}
				onfocusout={() => (focused = false)}
				onkeydown={(event) => {
					if (event.key === 'ArrowRight') go(index + 1);
					if (event.key === 'ArrowLeft') go(index - 1);
				}}
			>
				<div class="flex items-center gap-3 border-b border-ink/10 bg-salt px-3 py-2.5">
					<span class="flex gap-1.5" aria-hidden="true">
						<span class="size-2.5 rounded-full bg-[#ff5f57]"></span><span class="size-2.5 rounded-full bg-[#febc2e]"></span><span class="size-2.5 rounded-full bg-[#28c840]"></span>
					</span>
					{#if content.url}
						<span class="mx-auto min-w-0 max-w-[70%] truncate rounded-md bg-paper px-3 py-1 text-center font-mono text-[11.5px] text-ink-soft">{content.url}</span>
					{/if}
					<span class="w-[42px]" aria-hidden="true"></span>
				</div>

				<!-- The screenshots share one grid cell, so the frame takes their own shape (the tallest one) instead of cropping them. -->
				<div class="relative grid touch-pan-y bg-white {shots.length ? '' : 'aspect-[16/10]'}" onpointerdown={swipeStart} onpointerup={swipeEnd} onpointercancel={() => (startX = null)} role="presentation">
					{#if shots.length}
						{#each shots as shot, i (i)}
							<img
								src={imageSrc(shot.src, 1800)}
								alt={shot.caption || `Screenshot ${i + 1}`}
								loading={i === 0 ? 'eager' : 'lazy'}
								aria-hidden={i !== index}
								class="col-start-1 row-start-1 h-auto w-full self-start transition-[opacity,transform] duration-700 {i === index ? 'scale-100 opacity-100' : 'scale-[1.02] opacity-0'}"
							/>
						{/each}
						<button type="button" onclick={() => (large = true)} class="absolute right-3 top-3 grid size-9 place-items-center rounded-md bg-ink/60 text-paper opacity-80 transition-opacity hover:opacity-100" aria-label="View screenshot larger">
							<Maximize2 class="size-4" />
						</button>
					{:else}
						<div class="grid h-full place-items-center bg-gradient-to-br from-program/15 to-program/5 text-center">
							<p class="font-mono text-[12px] uppercase tracking-[0.06em] text-program">Screenshots coming soon</p>
						</div>
					{/if}
				</div>

				{#if shots.length}
					<figcaption class="flex items-center gap-3 border-t border-ink/10 px-3 py-2.5">
						<p class="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink" aria-live={playing ? 'off' : 'polite'}>
							{shots[index]?.caption || `Screenshot ${index + 1}`}
						</p>
						{#if shots.length > 1}
							<span class="hidden items-center gap-1.5 sm:flex">
								{#each shots as _, i (i)}
									<button type="button" onclick={() => go(i)} class="h-1.5 rounded-full transition-all {i === index ? 'w-6 bg-program' : 'w-1.5 bg-ink/25 hover:bg-ink/50'}" aria-label={`Show screenshot ${i + 1}`} aria-current={i === index ? 'true' : undefined}></button>
								{/each}
							</span>
							<span class="font-mono text-[11.5px] text-ink-soft sm:hidden">{index + 1} / {shots.length}</span>
							<span class="flex">
								<button type="button" onclick={() => go(index - 1)} class="grid size-8 place-items-center text-ink-soft hover:bg-salt hover:text-ink" aria-label="Previous screenshot"><ChevronLeft class="size-4" /></button>
								<button type="button" onclick={() => go(index + 1)} class="grid size-8 place-items-center text-ink-soft hover:bg-salt hover:text-ink" aria-label="Next screenshot"><ChevronRight class="size-4" /></button>
								{#if !reducedMotion.current}
									<button type="button" onclick={() => (paused = !paused)} class="grid size-8 place-items-center text-ink-soft hover:bg-salt hover:text-ink" aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}>
										{#if paused}<Play class="size-3.5" />{:else}<Pause class="size-3.5" />{/if}
									</button>
								{/if}
							</span>
						{/if}
					</figcaption>
				{/if}
			</figure>
		</div>
	</div>
</section>

<Dialog.Root bind:open={large}>
	<Dialog.Content
		class="max-w-[min(96vw,80rem)] gap-0 rounded-none border-none bg-ink p-0 text-paper sm:max-w-[min(96vw,80rem)]"
		showCloseButton={false}
		onkeydown={(event: KeyboardEvent) => {
			if (event.key === 'ArrowRight') go(index + 1);
			if (event.key === 'ArrowLeft') go(index - 1);
		}}
	>
		{#if shots[index]}
			<Dialog.Title class="sr-only">{shots[index].caption || `Screenshot ${index + 1}`}</Dialog.Title>
			<Dialog.Description class="sr-only">Screenshot {index + 1} of {shots.length}</Dialog.Description>
			<div class="relative grid place-items-center bg-black">
				<img src={imageSrc(shots[index].src, 2400)} alt={shots[index].caption || `Screenshot ${index + 1}`} class="max-h-[82vh] w-auto max-w-full object-contain" />
				{#if shots.length > 1}
					<button type="button" onclick={() => go(index - 1)} class="absolute left-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center bg-ink/70 hover:bg-ink" aria-label="Previous screenshot"><ChevronLeft class="size-5" /></button>
					<button type="button" onclick={() => go(index + 1)} class="absolute right-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center bg-ink/70 hover:bg-ink" aria-label="Next screenshot"><ChevronRight class="size-5" /></button>
				{/if}
			</div>
			<div class="flex items-center justify-between gap-4 px-4 py-3 text-[13px]">
				<span class="min-w-0 truncate">{shots[index].caption || `Screenshot ${index + 1}`}</span>
				<span class="flex shrink-0 items-center gap-3">
					<span class="font-mono text-[12px] text-paper/70">{index + 1} / {shots.length}</span>
					<Dialog.Close class="grid size-9 place-items-center hover:bg-paper/10" aria-label="Close"><X class="size-4" /></Dialog.Close>
				</span>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
