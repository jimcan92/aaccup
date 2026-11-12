<script lang="ts">
	import RichText from '#lib/components/site/rich-text.svelte';
	import Photo from '#lib/components/site/photo.svelte';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import Clock from '@lucide/svelte/icons/clock';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import { formatDate, type EventItem, type EventsContent } from '#lib/landing.js';
	import { reveal, stagger } from '#lib/motion.js';
	import Section from './section.svelte';

	let { content, tone }: { content: EventsContent; tone: 'paper' | 'salt' } = $props();

	// Philippine date, so an event stays "upcoming" through its last day here.
	const today = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
	const last = (item: EventItem) => item.end || item.date;
	const upcoming = $derived(content.items.filter((item) => last(item) >= today).sort((a, b) => a.date.localeCompare(b.date)));
	const past = $derived(content.items.filter((item) => last(item) < today).sort((a, b) => b.date.localeCompare(a.date)));

	// The lead card: the next (or current) event, else the most recent one.
	const featured = $derived(upcoming[0] ?? past[0]);
	const rest = $derived(upcoming.slice(1));
	const earlier = $derived((upcoming.length ? past : past.slice(1)).slice(0, upcoming.length ? 4 : 3));

	const live = (item: EventItem) => item.date <= today && last(item) >= today;
	const status = (item: EventItem) => (live(item) ? 'Happening now' : last(item) >= today ? 'Up next' : 'Latest event');

	const external = (href: string) => /^https?:/.test(href);
	const part = (value: string, options: Intl.DateTimeFormatOptions) =>
		new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', { ...options, timeZone: 'UTC' });
	const when = (item: EventItem) => (item.end && item.end !== item.date ? `${formatDate(item.date)} – ${formatDate(item.end)}` : formatDate(item.date));
	// "23" or "23–24"; a range across months keeps only the start day on the tile.
	const days = (item: EventItem) =>
		item.end && item.end !== item.date && item.end.slice(0, 7) === item.date.slice(0, 7)
			? `${part(item.date, { day: 'numeric' })}–${part(item.end, { day: 'numeric' })}`
			: part(item.date, { day: 'numeric' });
</script>

<!-- A poster or photo shown whole: a blurred copy fills the frame so any shape fits without cropping. -->
{#snippet poster(item: EventItem, frame: string, width: number)}
	<div class="relative overflow-hidden bg-ink {frame}">
		{#if item.photo}
			<Photo src={item.photo} alt="" {width} class="absolute! inset-0 scale-110 opacity-60 blur-2xl" loading="lazy" />
			<Photo src={item.photo} alt={item.title} {width} class="absolute! inset-0 bg-transparent!" imgClass="object-contain!" />
		{:else}
			<div class="absolute inset-0 grid place-items-center bg-program text-program-contrast" aria-hidden="true">
				<div class="text-center">
					<div class="font-mono text-[12px] uppercase tracking-[0.2em] opacity-80">{part(item.date, { month: 'long' })}</div>
					<div class="font-display text-[clamp(3.5rem,8vw,6rem)] font-semibold leading-none tracking-[-0.05em]">{days(item)}</div>
					<div class="mt-1 font-mono text-[12px] tracking-[0.2em] opacity-80">{part(item.date, { year: 'numeric' })}</div>
				</div>
			</div>
		{/if}
	</div>
{/snippet}

{#snippet tile(item: EventItem, large = false)}
	<div class="flex shrink-0 flex-col items-center justify-center bg-program text-program-contrast shadow-lg {large ? 'w-[4.5rem] py-2.5' : 'w-14 py-1.5'}" aria-hidden="true">
		<span class="font-mono uppercase tracking-[0.12em] opacity-85 {large ? 'text-[12px]' : 'text-[10px]'}">{part(item.date, { month: 'short' })}</span>
		<span class="font-display font-semibold leading-none tracking-[-0.04em] {large ? 'text-[30px]' : 'text-[22px]'}">{days(item)}</span>
	</div>
{/snippet}

{#snippet title(item: EventItem, size: string)}
	<h3 class="text-balance font-display font-semibold leading-[1.1] tracking-[-0.03em] text-ink {size}">
		{#if item.href}
			<a href={item.href} target={external(item.href) ? '_blank' : undefined} rel={external(item.href) ? 'noopener noreferrer' : undefined} class="hover:text-program hover:underline hover:underline-offset-4">
				{item.title}<ArrowUpRight class="ml-1 inline size-[0.8em] align-[-0.05em]" />
			</a>
		{:else}{item.title}{/if}
	</h3>
{/snippet}

{#snippet meta(item: EventItem)}
	<p class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-soft">
		<span class="inline-flex items-center gap-1.5"><Clock class="size-3.5 text-program" /><time datetime={item.date}>{when(item)}{item.time ? ` · ${item.time}` : ''}</time></span>
		{#if item.place}<span class="inline-flex items-center gap-1.5"><MapPin class="size-3.5 text-program" />{item.place}</span>{/if}
	</p>
{/snippet}

<Section title={content.title} {tone}>
	{#if featured}
		<article class="grid overflow-hidden border border-rule bg-paper lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
			<div class="relative">
				{@render poster(featured, 'aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[24rem]', 1600)}
				{#if featured.photo}<div class="absolute left-4 top-4">{@render tile(featured, true)}</div>{/if}
			</div>
			<div class="flex flex-col justify-center gap-4 p-6 sm:p-8 lg:p-10">
				<span class="inline-flex w-fit items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] {live(featured) ? 'text-program' : 'text-ink-soft'}">
					{#if live(featured)}
						<span class="relative flex size-2"><span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-program opacity-60"></span><span class="relative inline-flex size-2 rounded-full bg-program"></span></span>
					{:else}
						<span class="h-px w-6 bg-current"></span>
					{/if}
					{status(featured)}
				</span>
				{@render title(featured, 'text-[clamp(1.5rem,2.6vw,2.2rem)]')}
				{@render meta(featured)}
				{#if featured.body}
					<div class="max-w-[60ch] space-y-3 border-t border-rule pt-4 text-[15px] leading-relaxed text-ink-soft">
						<RichText text={featured.body} />
					</div>
				{/if}
			</div>
		</article>
	{/if}

	{#if !upcoming.length}
		<p class="mt-4 text-[13px] text-ink-soft">No upcoming events right now.</p>
	{/if}

	{#if rest.length}
		<h3 class="mt-12 font-mono text-[12px] uppercase tracking-[0.12em] text-ink-soft">Coming up</h3>
		<ul class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each rest as item, index (index)}
				<li class="flex flex-col border border-rule bg-paper" use:reveal={{ delay: stagger(index) }}>
					<div class="relative">
						{@render poster(item, 'aspect-[16/10]', 900)}
						{#if item.photo}<div class="absolute left-3 top-3">{@render tile(item)}</div>{/if}
					</div>
					<div class="grid gap-2 p-4 sm:p-5">
						{@render title(item, 'text-[18px]')}
						{@render meta(item)}
						{#if item.body}<div class="line-clamp-3 text-[14px] leading-relaxed text-ink-soft"><RichText text={item.body} /></div>{/if}
					</div>
				</li>
			{/each}
		</ul>
	{/if}

	{#if earlier.length}
		<h3 class="mt-12 font-mono text-[12px] uppercase tracking-[0.12em] text-ink-soft">Past events</h3>
		<ul class="mt-4 grid gap-4 sm:grid-cols-2 {earlier.length > 3 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}">
			{#each earlier as item, index (index)}
				<li class="group" use:reveal={{ delay: stagger(index) }}>
					{@render poster(item, 'aspect-[4/3]', 700)}
					<time datetime={item.date} class="mt-3 block font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft">{when(item)}</time>
					<div class="mt-1">{@render title(item, 'text-[16px]')}</div>
					{#if item.place}<p class="mt-1 text-[13px] text-ink-soft">{item.place}</p>{/if}
				</li>
			{/each}
		</ul>
	{/if}
</Section>
