<script lang="ts">
	import MapPin from '@lucide/svelte/icons/map-pin';
	import RichText from '#lib/components/site/rich-text.svelte';
	import { imageSrc } from '#lib/image-url.js';
	import type { PartnerItem, PartnersContent } from '#lib/landing.js';
	import { reveal, stagger } from '#lib/motion.js';
	import Section from './section.svelte';

	// Partners: an intro and a few figures, then the partners. When any partner names a group, they are
	// listed under group headings in the order the groups first appear; partners with no group come last.
	let { content, tone }: { content: PartnersContent; tone: 'paper' | 'salt' } = $props();

	const card = { paper: 'bg-salt', salt: 'bg-paper' };
	const stats = $derived(content.stats ?? []);
	const groups = $derived.by(() => {
		const order = new Map<string, PartnerItem[]>();
		for (const partner of content.items) {
			const name = partner.group?.trim() ?? '';
			if (!order.has(name)) order.set(name, []);
			order.get(name)!.push(partner);
		}
		const named = [...order].filter(([name]) => name);
		const rest = order.get('') ?? [];
		return named.length ? [...named, ...(rest.length ? [['Other partners', rest] as [string, PartnerItem[]]] : [])] : [['', rest] as [string, PartnerItem[]]];
	});
	// A partner with a sector, place or note gets a detail card; a name or logo alone stays a centred tile.
	const detailed = (partner: PartnerItem) => Boolean(partner.sector || partner.place || partner.note);
</script>

<Section title={content.title} {tone}>
	{#if content.intro || stats.length}
		<div class="mb-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-end">
			{#if content.intro}
				<div class="max-w-[60ch] space-y-4 text-[15px] leading-relaxed text-ink-soft sm:text-[16px]"><RichText text={content.intro} /></div>
			{/if}
			{#if stats.length}
				<dl class="flex flex-wrap gap-px border border-rule bg-rule {content.intro ? '' : 'lg:col-span-2'}">
					{#each stats as stat, i (i)}
						<div class="min-w-0 flex-1 basis-[8rem] {card[tone]} p-4" use:reveal={{ delay: stagger(i) }}>
							<dd class="font-display text-[clamp(1.8rem,3.4vw,2.5rem)] font-semibold leading-none tracking-[-0.05em] text-program">{stat.value}</dd>
							<dt class="mt-1.5 text-[13px] leading-snug text-ink-soft">{stat.label}</dt>
						</div>
					{/each}
				</dl>
			{/if}
		</div>
	{/if}

	<div class="grid gap-10">
		{#each groups as [group, partners] (group)}
			<div>
				{#if group}
					<h3 class="mb-4 flex items-baseline gap-3 border-b border-rule pb-2 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-ink-soft">
						<span>{group}</span>
						<span class="text-ink-soft/60">{partners.length}</span>
					</h3>
				{/if}
				<ul class="grid gap-3 {partners.some(detailed) ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'}">
					{#each partners as partner, index (index)}
						<li use:reveal={{ delay: stagger(index) }}>
							<svelte:element
								this={partner.href ? 'a' : 'div'}
								href={partner.href || undefined}
								target={partner.href ? '_blank' : undefined}
								rel={partner.href ? 'noopener noreferrer' : undefined}
								class="group flex h-full flex-col border border-rule p-5 transition-colors {partner.href ? 'hover:border-program/50' : ''} {detailed(partner) ? `${card[tone]} gap-2` : 'items-center justify-center gap-3 bg-paper text-center'}"
							>
								{#if partner.logo}
									<img src={imageSrc(partner.logo, 400)} alt="" loading="lazy" class="h-12 w-auto max-w-full object-contain grayscale transition duration-300 group-hover:grayscale-0 {detailed(partner) ? 'self-start' : 'h-14'}" />
								{/if}
								{#if detailed(partner)}
									<span class="font-display text-[16px] font-semibold leading-snug text-ink">{partner.name}</span>
									{#if partner.sector}
										<span class="text-[13px] leading-snug text-ink-soft">{partner.sector}</span>
									{/if}
									{#if partner.place || partner.note}
										<span class="mt-auto grid gap-1 pt-2 text-[12px] leading-snug">
											{#if partner.place}
												<span class="flex items-start gap-1.5 text-ink-soft"><MapPin class="mt-px size-3.5 shrink-0" />{partner.place}</span>
											{/if}
											{#if partner.note}
												<span class="font-medium text-program-ink">{partner.note}</span>
											{/if}
										</span>
									{/if}
								{:else}
									<span class="text-[13px] font-medium leading-snug {partner.logo ? 'text-ink-soft' : 'font-display text-[16px] font-semibold text-ink'}">{partner.name}</span>
								{/if}
							</svelte:element>
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	</div>
</Section>
