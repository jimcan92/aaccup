<script lang="ts">
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import { paragraphs } from '#lib/image-url.js';
	import { formatDate, type EventItem, type EventsContent } from '#lib/landing.js';
	import Section from './section.svelte';

	let { content, tone }: { content: EventsContent; tone: 'paper' | 'salt' } = $props();

	// Philippine date, so an event stays "upcoming" through its last day here.
	const today = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
	const upcoming = $derived(content.items.filter((item) => (item.end || item.date) >= today).sort((a, b) => a.date.localeCompare(b.date)));
	const past = $derived(content.items.filter((item) => (item.end || item.date) < today).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4));

	const external = (href: string) => /^https?:/.test(href);
	const part = (value: string, options: Intl.DateTimeFormatOptions) =>
		new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', { ...options, timeZone: 'UTC' });
	const when = (item: EventItem) => (item.end && item.end !== item.date ? `${formatDate(item.date)} – ${formatDate(item.end)}` : formatDate(item.date));
</script>

<Section title={content.title} {tone}>
	{#if upcoming.length}
		<ul class="grid gap-3 md:grid-cols-2">
			{#each upcoming as item, index (index)}
				<li class="flex gap-4 border border-rule bg-paper p-4 sm:p-5">
					<div class="flex w-16 shrink-0 flex-col items-center justify-center bg-program py-2 text-program-contrast" aria-hidden="true">
						<span class="font-mono text-[11px] uppercase tracking-[0.1em] opacity-85">{part(item.date, { month: 'short' })}</span>
						<span class="font-display text-[28px] font-semibold leading-none tracking-[-0.04em]">{part(item.date, { day: 'numeric' })}</span>
					</div>
					<div class="min-w-0">
						<h3 class="font-display text-[17px] font-semibold leading-snug tracking-[-0.02em] text-ink">
							{#if item.href}
								<a href={item.href} target={external(item.href) ? '_blank' : undefined} rel={external(item.href) ? 'noopener noreferrer' : undefined} class="inline-flex items-start gap-1 hover:text-program hover:underline hover:underline-offset-4">{item.title}<ArrowUpRight class="mt-1 size-4 shrink-0" /></a>
							{:else}{item.title}{/if}
						</h3>
						<p class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] text-ink-soft">
							<span class="inline-flex items-center gap-1"><CalendarDays class="size-3.5" /><time datetime={item.date}>{when(item)}{item.time ? `, ${item.time}` : ''}</time></span>
							{#if item.place}<span class="inline-flex items-center gap-1"><MapPin class="size-3.5" />{item.place}</span>{/if}
						</p>
						{#if item.body}
							<div class="mt-2 space-y-2 text-[14px] leading-relaxed text-ink-soft">
								{#each paragraphs(item.body) as paragraph, p (p)}<p>{paragraph}</p>{/each}
							</div>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="border border-dashed border-rule p-5 text-[14px] text-ink-soft">No upcoming events right now.</p>
	{/if}

	{#if past.length}
		<h3 class="mt-10 font-mono text-[12px] uppercase tracking-[0.12em] text-ink-soft">Past events</h3>
		<ul class="mt-3 border-t border-rule">
			{#each past as item, index (index)}
				<li class="grid gap-1 border-b border-rule py-3 text-[14px] sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-6">
					<time datetime={item.date} class="font-mono text-[12px] text-ink-soft sm:pt-0.5">{when(item)}</time>
					<span class="text-ink">{item.title}{#if item.place}<span class="text-ink-soft">{` · ${item.place}`}</span>{/if}</span>
				</li>
			{/each}
		</ul>
	{/if}
</Section>
