<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { fade } from 'svelte/transition';
	import Photo from '#lib/components/site/photo.svelte';
	import { imageSrc } from '#lib/image-url.js';
	import type { OrgContent, OrgItem } from '#lib/landing.js';
	import { buildOrgTree, countUnder, hasReportingLines, layoutCompactChart, pathTo, startingFocus } from '#lib/org-tree.js';
	import Initials from './initials.svelte';
	import RoleText from './role-text.svelte';
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
	const shown = $derived(new Set([...(focus ? [focus] : []), ...children]));
	const onPath = $derived(new Set(path));

	// The whole chart in small: grid cells from the compact layout, drawn in SVG units.
	const chartMap = $derived(layoutCompactChart(tree));
	const cellW = 32;
	const cellH = 36;
	const pad = 18;
	const dot = 24;
	const mapW = $derived(pad * 2 + (chartMap.columns - 1) * cellW);
	const mapH = $derived(pad * 2 + (chartMap.rows - 1) * cellH);
	const spot = (key: string) => {
		const cell = chartMap.cells.get(key)!;
		return { x: pad + cell.x * cellW, y: pad + cell.y * cellH };
	};
	function edge(from: string, to: string): string {
		const a = spot(from);
		const b = spot(to);
		const bar = a.y + cellH / 2;
		// People stacked in a column hang off a spine just left of their photos.
		if (chartMap.cells.get(to)!.stacked) {
			const spine = b.x - dot / 2 - 4;
			return `M${a.x} ${a.y}V${bar}H${spine}V${b.y}H${b.x}`;
		}
		return `M${a.x} ${a.y}V${bar}H${b.x}V${b.y}`;
	}
	// The part of the map shown on the right: the open office and the people under it.
	const view = $derived.by(() => {
		if (!focus) return null;
		const points = [...shown].map(spot);
		const xs = points.map((p) => p.x);
		const ys = points.map((p) => p.y);
		const r = dot / 2 + 5;
		return { x: Math.min(...xs) - r, y: Math.min(...ys) - r, width: Math.max(...xs) - Math.min(...xs) + r * 2, height: Math.max(...ys) - Math.min(...ys) + r * 2 };
	});

	// Name and position of the small photo under the pointer or keyboard focus.
	let hovered = $state<string | null>(null);

	let chart = $state<HTMLElement>();

	function open(key: string) {
		const node = tree.nodes.get(key);
		if (!node) return;
		// A box with nobody under it opens the office it belongs to, so it stays on screen.
		chosen = node.children.length ? key : (node.parent ?? key);
		if (chart && chart.getBoundingClientRect().top < 0) chart.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	const pct = (value: number, of: number) => `${(value / of) * 100}%`;
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
	<div class="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 via-black/70 to-transparent px-2.5 pb-2 pt-7 text-center text-white sm:px-3 sm:pb-2.5">
		<p class="text-balance font-display text-[13px] font-semibold leading-[1.15] tracking-[-0.01em] {lead ? 'sm:text-[15px]' : ''}">{person.name}</p>
		<div class="mt-0.5"><RoleText text={person.role} lines={under ? 1 : 2} class="text-[11px] font-medium leading-snug text-white/90 {lead ? 'sm:text-[12px]' : ''}" /></div>
		{#if person.unit}<p class="text-[11px] leading-snug text-white/75">{person.unit}</p>{/if}
		{#if under}
			<span class="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-px text-[11px] font-semibold text-white ring-1 ring-white/30 group-has-[>button:hover]:bg-white/25">
				{under} under <ChevronDown class="size-3.5" />
			</span>
		{/if}
	</div>
{/snippet}

<!-- The photo fills the card; name and role sit on a dark band at the bottom so they stay readable. -->
{#snippet card(person: OrgItem, top: boolean, narrow = false)}
	<li class="relative aspect-[4/5] w-[calc(50%-0.375rem)] overflow-hidden border bg-paper {top ? 'border-program border-t-4 sm:w-64' : `border-rule ${narrow ? 'sm:w-44' : 'sm:w-52'}`}">
		{@render face(person, top)}
		{@render caption(person, top)}
	</li>
{/snippet}

<!-- The whole chart in small, with a photo for each person; click a photo to open that office. -->
{#snippet chartMapView()}
	<div class="relative mx-auto w-full" style:aspect-ratio={`${mapW} / ${mapH}`} style:max-width={`${mapW * 1.5}px`}>
		<svg viewBox={`0 0 ${mapW} ${mapH}`} class="absolute inset-0 h-full w-full" aria-hidden="true">
			{#if view}<rect x={view.x} y={view.y} width={view.width} height={view.height} rx="6" class="fill-program/10 stroke-program/50" stroke-width="1" />{/if}
			{#each [...tree.nodes.values()] as node (node.key)}
				{#if node.parent}
					<path d={edge(node.parent, node.key)} fill="none" class={onPath.has(node.key) || (node.parent === focus) ? 'stroke-program' : 'stroke-ink/25'} stroke-width={onPath.has(node.key) ? 1.8 : 1} />
				{/if}
			{/each}
		</svg>
		{#each [...tree.nodes.values()] as node (node.key)}
			{@const p = spot(node.key)}
			{@const isFocus = node.key === focus}
			{@const lit = isFocus || onPath.has(node.key) || shown.has(node.key)}
			<button
				type="button"
				onclick={() => open(node.key)}
				onpointerenter={() => (hovered = node.key)}
				onpointerleave={() => (hovered = hovered === node.key ? null : hovered)}
				onfocus={() => (hovered = node.key)}
				onblur={() => (hovered = hovered === node.key ? null : hovered)}
				aria-label={`${node.item.name}, ${node.item.role}`}
				aria-current={isFocus ? 'true' : undefined}
				class="absolute -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full bg-paper transition-[opacity,box-shadow] hover:z-10 hover:opacity-100 hover:ring-2 hover:ring-program focus-visible:z-10 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-program {isFocus ? 'z-10 ring-[3px] ring-program' : lit ? 'ring-2 ring-program/70' : 'opacity-60 ring-1 ring-ink/25'}"
				style:left={pct(p.x, mapW)}
				style:top={pct(p.y, mapH)}
				style:width={pct(dot * (isFocus ? 1.3 : 1), mapW)}
				style:aspect-ratio="1"
			>
				{#if node.item.thumb || node.item.photo}
					<img src={imageSrc(node.item.thumb || node.item.photo!, 120)} alt="" loading="lazy" class="h-full w-full object-cover object-top" />
				{:else}
					<Initials name={node.item.name} class="h-full w-full text-[9px]" />
				{/if}
			</button>
		{/each}

		{#if hovered && tree.nodes.has(hovered)}
			{@const p = spot(hovered)}
			{@const node = tree.nodes.get(hovered)!}
			{@const leftSide = p.x > mapW / 2}
			<!-- Tooltip: who the small photo is. -->
			<div
				class="pointer-events-none absolute z-20 w-max max-w-[15rem] -translate-y-1/2 border border-rule bg-paper px-2.5 py-1.5 shadow-lg {leftSide ? '-translate-x-full' : ''}"
				style:left={leftSide ? `calc(${pct(p.x, mapW)} - 22px)` : `calc(${pct(p.x, mapW)} + 22px)`}
				style:top={pct(p.y, mapH)}
				role="tooltip"
			>
				<p class="text-[12px] font-semibold leading-tight text-ink">{node.item.name}</p>
				<p class="mt-0.5 text-[11px] leading-snug text-program">{node.item.role}</p>
				{#if node.children.length}<p class="mt-0.5 text-[11px] leading-snug text-ink-soft">{countUnder(tree, hovered)} under · click to open</p>{/if}
			</div>
		{/if}
	</div>
{/snippet}

<Section title={content.title} {tone}>
	{#if isTree && focus}
		<div class="grid gap-6 lg:grid-cols-2 lg:gap-10">
			<!-- Small screens: the chart folds away above the open office. -->
			<details class="border border-rule bg-paper lg:hidden">
				<summary class="cursor-pointer px-4 py-2.5 text-[13px] font-medium text-ink-soft">Whole organization chart</summary>
				<div class="max-h-[70vh] overflow-auto p-3">{@render chartMapView()}</div>
			</details>

			<!-- Wide screens: the whole chart on the left, used to move around. -->
			<div class="hidden lg:block">
				<div class="sticky top-20">
					<p class="mb-2 text-[12px] font-medium text-ink-soft">Whole organization — click a photo to see the people under that office</p>
					<div class="max-h-[calc(100vh-7rem)] overflow-auto border border-rule bg-paper p-3">{@render chartMapView()}</div>
				</div>
			</div>

			<!-- The open office and the people under it. -->
			<div bind:this={chart} class="flex scroll-mt-20 flex-col items-center">
				{#if path.length > 1}
					<!-- The offices above the open one; each opens its own part of the chart. -->
					<ol class="flex max-w-full flex-wrap items-center justify-center gap-1.5" aria-label="Offices above">
						{#each path.slice(0, -1) as key, index (key)}
							{@const person = tree.nodes.get(key)!.item}
							{#if index > 0}<li aria-hidden="true"><ChevronRight class="size-4 text-ink-soft" /></li>{/if}
							<li>
								<button type="button" onclick={() => open(key)} class="flex items-center gap-2 border border-rule bg-paper py-1 pl-1 pr-3 text-left hover:border-program">
									<span class="relative block size-9 shrink-0 overflow-hidden rounded-full">
										{#if person.thumb || person.photo}<img src={imageSrc(person.thumb || person.photo!, 120)} alt="" class="h-full w-full object-cover object-top" />{:else}<Initials name={person.name} class="h-full w-full text-[12px]" />{/if}
									</span>
									<span class="grid">
										<span class="max-w-[10rem] truncate text-[12px] font-semibold leading-tight text-ink">{person.name}</span>
										<span class="max-w-[10rem] truncate text-[11px] leading-tight text-program">{person.role}</span>
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
									<li class="group relative aspect-[4/5] w-[calc(50%-0.375rem)] overflow-hidden border border-rule bg-paper transition-shadow has-[>button:hover]:border-program has-[>button:hover]:shadow-lg sm:w-44">
										{@render face(node.item, false)}
										<!-- The whole card opens the office; the role above it has its own toggle. -->
										<button
											type="button"
											onclick={() => open(key)}
											aria-label={`${node.item.name}, ${node.item.role}: show the ${countUnder(tree, key)} people under this office`}
											class="absolute inset-0 block focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-program"
										></button>
										{@render caption(node.item, false, countUnder(tree, key))}
									</li>
								{:else}
									{@render card(node.item, false, true)}
								{/if}
							{/each}
						</ul>
					{/key}
				{/if}
			</div>
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
