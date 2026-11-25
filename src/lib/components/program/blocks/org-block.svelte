<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { fade } from 'svelte/transition';
	import Photo from '#lib/components/site/photo.svelte';
	import type { OrgContent, OrgItem } from '#lib/landing.js';
	import { buildOrgTree, countUnder, hasReportingLines, layoutOrgTree, pathTo, startingFocus } from '#lib/org-tree.js';
	import Initials from './initials.svelte';
	import Section from './section.svelte';

	let { content, tone }: { content: OrgContent; tone: 'paper' | 'salt' } = $props();

	// Rows from the top: levels 1 to 4; empty levels are skipped.
	const rows = $derived(
		[1, 2, 3, 4].map((level) => content.items.filter((item) => (item.level ?? 2) === level)).filter((row) => row.length)
	);

	// With reporting lines the chart is a tree: one office is open at a time, with the people under it.
	const isTree = $derived(hasReportingLines(content.items));
	const tree = $derived(buildOrgTree(content.items));
	let chosen = $state<string | null>(null);
	const focus = $derived(chosen && tree.nodes.has(chosen) ? chosen : startingFocus(tree));
	const path = $derived(focus ? pathTo(tree, focus) : []);
	const children = $derived(focus ? tree.nodes.get(focus)!.children : []);

	// Minimap geometry.
	const map = $derived(layoutOrgTree(tree));
	const colGap = 34;
	const rowGap = 7;
	const pad = 6;
	const at = (key: string) => {
		const p = map.positions.get(key)!;
		return { x: pad + p.x * colGap, y: pad + p.y * rowGap };
	};
	const mapWidth = $derived(pad * 2 + (map.columns - 1) * colGap);
	const mapHeight = $derived(pad * 2 + (map.rows - 1) * rowGap);
	const shown = $derived(new Set([...(focus ? [focus] : []), ...children]));
	const onPath = $derived(new Set(path));
	// The part of the map that is on screen: the open office and the people under it.
	const view = $derived.by(() => {
		if (!focus) return null;
		const points = [...shown].map(at);
		const xs = points.map((p) => p.x);
		const ys = points.map((p) => p.y);
		return { x: Math.min(...xs) - 4, y: Math.min(...ys) - 4, width: Math.max(...xs) - Math.min(...xs) + 8, height: Math.max(...ys) - Math.min(...ys) + 8 };
	});

	let chart = $state<HTMLElement>();

	function open(key: string) {
		const node = tree.nodes.get(key);
		if (!node) return;
		// A box with nobody under it opens the office it belongs to, so it stays on screen.
		chosen = node.children.length ? key : (node.parent ?? key);
		if (chart && chart.getBoundingClientRect().top < 0) chart.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}
</script>

{#snippet face(person: OrgItem, lead: boolean)}
	<div class="absolute inset-0">
		{#if person.photo}
			<Photo src={person.photo} alt={person.name} width={600} class="h-full w-full" imgClass="object-top" iconClass="size-6" />
		{:else}
			<Initials name={person.name} class="h-full w-full text-[44px] {lead ? 'sm:text-[56px]' : ''}" />
		{/if}
	</div>
{/snippet}

{#snippet caption(person: OrgItem, lead: boolean, under = 0)}
	<div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/70 to-transparent px-2.5 pb-2.5 pt-8 text-center text-white sm:px-3 sm:pb-3">
		<p class="text-balance font-display text-[13px] font-semibold leading-tight tracking-[-0.01em] {lead ? 'sm:text-[15px]' : ''}">{person.name}</p>
		<p class="mt-0.5 text-[11px] font-medium leading-snug text-white/90 {lead ? 'sm:text-[12px]' : ''}">{person.role}</p>
		{#if person.unit}<p class="text-[11px] leading-snug text-white/75">{person.unit}</p>{/if}
		{#if under}
			<span class="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold text-white ring-1 ring-white/30 group-hover:bg-white/25">
				{under} under <ChevronDown class="size-3.5" />
			</span>
		{/if}
	</div>
{/snippet}

<!-- The photo fills the card; name and role sit on a dark band at the bottom so they stay readable. -->
{#snippet card(person: OrgItem, top: boolean)}
	<li class="relative aspect-[4/5] w-[calc(50%-0.375rem)] overflow-hidden border bg-paper {top ? 'border-program border-t-4 sm:w-64' : 'border-rule sm:w-52'}">
		{@render face(person, top)}
		{@render caption(person, top)}
	</li>
{/snippet}

<Section title={content.title} {tone}>
	{#if isTree && focus}
		<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_13rem] lg:gap-10">
			<!-- Small screens: the map folds away above the chart. -->
			<details class="border border-rule bg-paper lg:hidden">
				<summary class="cursor-pointer px-4 py-2.5 text-[13px] font-medium text-ink-soft">Map of the whole organization</summary>
				<div class="max-h-[60vh] overflow-auto px-4 pb-4">{@render minimap()}</div>
			</details>

			<div bind:this={chart} class="flex scroll-mt-20 flex-col items-center">
				{#if path.length > 1}
					<!-- The offices above the open one; each opens its own part of the chart. -->
					<ol class="flex max-w-full flex-wrap items-center justify-center gap-1.5" aria-label="Offices above">
						{#each path.slice(0, -1) as key, index (key)}
							{@const person = tree.nodes.get(key)!.item}
							{#if index > 0}<li aria-hidden="true"><ChevronRight class="size-4 text-ink-soft" /></li>{/if}
							<li>
								<button type="button" onclick={() => open(key)} class="flex items-center gap-2 border border-rule bg-paper py-1 pl-1 pr-3 text-left hover:border-program">
									<span class="relative block h-10 w-8 shrink-0 overflow-hidden">
										{#if person.photo}<Photo src={person.photo} alt="" width={120} class="h-full w-full" imgClass="object-top" iconClass="size-3" />{:else}<Initials name={person.name} class="h-full w-full text-[12px]" />{/if}
									</span>
									<span class="grid">
										<span class="max-w-[11rem] truncate text-[12px] font-semibold leading-tight text-ink">{person.name}</span>
										<span class="max-w-[11rem] truncate text-[11px] leading-tight text-program">{person.role}</span>
									</span>
								</button>
							</li>
						{/each}
					</ol>
					<span class="h-6 w-px bg-program/40" aria-hidden="true"></span>
				{/if}

				{#key focus}
					<ul class="flex w-full justify-center" in:fade={{ duration: 200 }}>{@render card(tree.nodes.get(focus)!.item, true)}</ul>
				{/key}

				{#if children.length}
					<span class="h-8 w-px bg-program/40" aria-hidden="true"></span>
					{#key focus}
						<ul class="flex w-full flex-wrap justify-center gap-3 {children.length > 1 ? 'border-t border-program/40 pt-6' : ''}" in:fade={{ duration: 250 }}>
							{#each children as key (key)}
								{@const node = tree.nodes.get(key)!}
								{#if node.children.length}
									<li class="w-[calc(50%-0.375rem)] sm:w-52">
										<button
											type="button"
											onclick={() => open(key)}
											aria-label={`${node.item.name}, ${node.item.role}: show the ${countUnder(tree, key)} people under this office`}
											class="group relative block aspect-[4/5] w-full overflow-hidden border border-rule bg-paper text-left transition-shadow hover:border-program hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-program"
										>
											{@render face(node.item, false)}
											{@render caption(node.item, false, countUnder(tree, key))}
										</button>
									</li>
								{:else}
									{@render card(node.item, false)}
								{/if}
							{/each}
						</ul>
					{/key}
				{/if}
			</div>

			<aside class="hidden lg:block" aria-label="Map of the whole organization">
				<div class="sticky top-24">
					<p class="mb-2 text-[12px] font-medium text-ink-soft">Where you are</p>
					<div class="max-h-[calc(100vh-8rem)] overflow-auto border border-rule bg-paper p-2">{@render minimap()}</div>
				</div>
			</aside>
		</div>
	{:else}
		<div class="flex flex-col items-center">
			{#each rows as row, index (index)}
				{#if index > 0}<span class="h-8 w-px bg-program/40" aria-hidden="true"></span>{/if}
				<!-- The top border joins the boxes of a row, like the bar of an org chart. -->
				<ul class="flex w-full flex-wrap justify-center gap-3 {index > 0 && row.length > 1 ? 'border-t border-program/40 pt-6' : ''}">
					{#each row as person, i (i)}{@render card(person, index < 2 && row.length === 1)}{/each}
				</ul>
			{/each}
		</div>
	{/if}
</Section>

{#snippet minimap()}
	<svg viewBox={`0 0 ${mapWidth} ${mapHeight}`} class="block w-full" style:max-width={`${mapWidth * 1.6}px`} role="img" aria-label="Map of the whole organization; the highlighted part is on screen">
		{#if view}<rect x={view.x} y={view.y} width={view.width} height={view.height} rx="3" class="fill-program/12 stroke-program/50" stroke-width="0.75" />{/if}
		{#each [...tree.nodes.values()] as node (node.key)}
			{#if node.parent}
				{@const a = at(node.parent)}
				{@const b = at(node.key)}
				<path d={`M${a.x} ${a.y}H${(a.x + b.x) / 2}V${b.y}H${b.x}`} fill="none" class={onPath.has(node.key) ? 'stroke-program' : 'stroke-ink/20'} stroke-width={onPath.has(node.key) ? 1.25 : 0.75} />
			{/if}
		{/each}
		{#each [...tree.nodes.values()] as node (node.key)}
			{@const p = at(node.key)}
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
			<g class="cursor-pointer" onclick={() => open(node.key)}>
				<title>{node.item.name} — {node.item.role}</title>
				<circle cx={p.x} cy={p.y} r="5" fill="transparent" />
				<circle
					cx={p.x}
					cy={p.y}
					r={node.key === focus ? 3.6 : 2.3}
					class={node.key === focus ? 'fill-program stroke-paper' : onPath.has(node.key) ? 'fill-program' : shown.has(node.key) ? 'fill-program/70' : 'fill-ink/30'}
					stroke-width={node.key === focus ? 1.2 : 0}
				/>
			</g>
		{/each}
	</svg>
{/snippet}
