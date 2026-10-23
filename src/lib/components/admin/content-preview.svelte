<script lang="ts">
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import { site } from '#lib/data/site.js';

	type Slide = {
		src: string;
		alt: string;
		caption: string;
		meta: string;
	};

	let {
		blockKey,
		label,
		type,
		value
	}: {
		blockKey: string;
		label: string;
		type: string;
		value: string;
	} = $props();

	const isHero = $derived(blockKey.startsWith('home.hero'));
	const isVmgo = $derived(blockKey.startsWith('vmgo.'));
	const isSite = $derived(blockKey.startsWith('site.'));
	const isCarousel = $derived(blockKey === 'home.carousel');

	const slides = $derived.by<Slide[]>(() => {
		if (!isCarousel) return [];
		try {
			const parsed = JSON.parse(value);
			if (!Array.isArray(parsed)) return [];
			return parsed.filter(
				(slide): slide is Slide =>
					Boolean(slide) &&
					typeof slide === 'object' &&
					typeof slide.src === 'string' &&
					typeof slide.alt === 'string' &&
					typeof slide.caption === 'string' &&
					typeof slide.meta === 'string'
			);
		} catch {
			return [];
		}
	});
</script>

<div class="lg:sticky lg:top-24 lg:self-start">
	<div class="flex items-center justify-between border border-b-0 border-rule bg-paper px-4 py-2.5">
		<p class="font-mono text-[12px] text-ink-soft">Live preview</p>
		<span class="font-mono text-[13px] uppercase tracking-[0.08em] text-ink-soft">Draft</span>
	</div>

	<div class="overflow-hidden border border-rule bg-paper">
		{#if isCarousel}
			{#if slides.length > 0}
				<div class="relative aspect-[16/9] bg-ink">
					<img
						src={slides[0].src}
						alt={slides[0].alt}
						class="absolute inset-0 h-full w-full object-cover"
						onerror={(event) => {
							(event.currentTarget as HTMLImageElement).style.opacity = '0';
						}}
					/>
					<div class="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent"></div>
					<div class="absolute inset-x-0 bottom-0 p-4">
						<p class="font-mono text-[13px] text-paper/55">{slides[0].meta}</p>
						<p class="mt-1 font-display text-[18px] font-semibold leading-tight tracking-[-0.03em] text-paper">
							{slides[0].caption}
						</p>
					</div>
				</div>
				<div class="p-4">
					<p class="font-mono text-[12px] text-ink-soft">{slides.length} slides · first slide shown</p>
					<div class="mt-3 grid grid-cols-3 gap-2">
						{#each slides.slice(0, 3) as slide (slide.src)}
							<div class="border border-rule bg-salt p-2">
								<p class="line-clamp-2 text-[12px] leading-snug text-ink-soft">{slide.caption}</p>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div class="p-6">
					<p class="font-display text-[18px] font-semibold tracking-[-0.03em]">No valid slides yet.</p>
					<p class="mt-2 text-[13px] leading-relaxed text-ink-soft">
						Add a JSON array with at least one slide that has <code class="font-mono">src</code>,
						<code class="font-mono">alt</code>, <code class="font-mono">caption</code>, and
						<code class="font-mono">meta</code>.
					</p>
				</div>
			{/if}
		{:else if isHero}
			<div class="relative min-h-[17rem] overflow-hidden bg-ink p-6 text-paper">
				<div class="pointer-events-none absolute inset-0 opacity-10" aria-hidden="true">
					<svg viewBox="0 0 600 400" fill="none" class="h-full w-full">
						<g stroke="currentColor" stroke-width="0.8">
							<path d="M-20 300C90 260 150 330 250 290C350 250 390 180 500 190C560 196 600 220 640 210" />
							<path d="M-20 330C94 290 164 360 270 320C376 280 416 220 520 228C580 232 610 250 640 244" />
						</g>
					</svg>
				</div>
				<div class="relative">
					<p class="font-mono text-[13px] text-paper/45">AACCUP Level III visit · 2026</p>
					{#if blockKey === 'home.hero.title'}
						<p class="mt-5 max-w-md font-display text-[clamp(1.8rem,3.5vw,2.8rem)] font-semibold leading-[0.92] tracking-[-0.05em]">
							{value || 'Two volumes. One campus.'}
						</p>
					{:else}
						<p class="mt-5 max-w-sm text-[12px] leading-relaxed text-paper/65">
							{value || site.intro}
						</p>
					{/if}
				</div>
			</div>
		{:else if isVmgo}
			<div class="p-6">
				<p class="font-mono text-[13px] text-ink-soft">{label}</p>
				{#if blockKey === 'vmgo.source'}
					<a href={value} target="_blank" rel="noopener noreferrer" class="mt-3 inline-flex items-center gap-1.5 border-b border-ink pb-1 text-[13px] font-medium text-ink">
						{value || 'https://www.ctu.edu.ph/moalboal/about/vmgo/'}
						<ArrowUpRight class="size-3.5" />
					</a>
				{:else if blockKey === 'vmgo.vision'}
					<blockquote class="mt-3 font-display text-[clamp(1.4rem,2.4vw,2.1rem)] font-semibold leading-[1.08] tracking-[-0.04em]">
						“{value || 'Vision text'}”
					</blockquote>
				{:else}
					<p class="mt-3 text-[12px] leading-relaxed text-ink-soft">{value || 'Mission text'}</p>
				{/if}
			</div>
		{:else if isSite}
			<div class="p-6">
				<p class="font-mono text-[13px] text-ink-soft">{label}</p>
				<p class="mt-3 text-[13px] leading-relaxed text-ink">{value || 'Value'}</p>
				{#if blockKey === 'site.address'}
					<p class="mt-4 border-t border-rule pt-3 text-[13px] text-ink-soft">Campus contact card · Moalboal, Cebu</p>
				{/if}
			</div>
		{:else}
			<div class="p-6">
				<p class="font-mono text-[13px] text-ink-soft">{label} · {type}</p>
				<pre class="mt-3 max-h-60 overflow-auto whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-ink-soft">{value || 'Empty value'}</pre>
			</div>
		{/if}
	</div>

	<p class="mt-2 text-[12px] leading-relaxed text-ink-soft">
		Live preview of the draft value. The published version stays live until you press Publish.
	</p>
</div>
