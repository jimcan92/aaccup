<script lang="ts">
	import PanelLeft from '@lucide/svelte/icons/panel-left';
	import Search from '@lucide/svelte/icons/search';
	import X from '@lucide/svelte/icons/x';
	import Check from '@lucide/svelte/icons/check';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import { page } from '$app/state';
	import SectionNav from '#lib/components/program/section-nav.svelte';
	import Logo from '#lib/components/site/logo.svelte';
	import ManageLink from '#lib/components/site/manage-link.svelte';
	import ThemeToggle from '#lib/components/site/theme-toggle.svelte';
	import * as Sheet from '#lib/components/ui/sheet/index.js';
	import { visitBase } from '#lib/data/accreditation.js';
	import type { Program, Visit } from '#lib/data/types.js';
	import { themeStyle } from '#lib/theme.js';

	/**
	 * The one public header, in the root layout. On program pages (their data has a program, visit
	 * and base) it shows the program in its colour with search, the visit selector and, on smaller
	 * screens, the sections drawer; elsewhere the campus header. On wide screens both start tall and shrink
	 * on scroll; phones and tablets keep the compact size, since a tall header there eats the first screen.
	 */
	type ProgramData = { program?: Program; visit?: Visit; base?: string };
	const current = $derived.by(() => {
		const data = page.data as ProgramData;
		return data.program && data.visit && data.base ? { program: data.program, visit: data.visit, base: data.base } : null;
	});
	const program = $derived(current?.program as Program);
	const visit = $derived(current?.visit as Visit);
	const base = $derived(current?.base ?? '/');
	const style = $derived(current ? themeStyle(current.program.theme) : '');

	let drawerOpen = $state(false);
	const visits = $derived(current ? [...current.program.visits].sort((a, b) => b.year - a.year) : []);

	// Tall at the top, compact once scrolled; two thresholds so it cannot flicker at one position.
	let scrollY = $state(0);
	let compact = $state(false);
	$effect(() => {
		if (!compact && scrollY > 48) compact = true;
		else if (compact && scrollY < 8) compact = false;
	});

	function closeOnOutside(node: HTMLDetailsElement) {
		function onPointer(event: MouseEvent) {
			if (!node.contains(event.target as Node)) node.open = false;
		}

		function onKey(event: KeyboardEvent) {
			if (event.key === 'Escape' && node.open) {
				node.open = false;
				node.querySelector('summary')?.focus();
			}
		}

		document.addEventListener('click', onPointer);
		document.addEventListener('keydown', onKey);

		return {
			destroy() {
				document.removeEventListener('click', onPointer);
				document.removeEventListener('keydown', onKey);
			}
		};
	}
</script>

<svelte:window bind:scrollY />

{#snippet visitSelector()}
	<details class="relative" use:closeOnOutside>
		<summary
			class="inline-flex h-9 cursor-pointer list-none items-center gap-2 border border-program-contrast/35 px-3 text-[12px] font-medium transition-colors hover:bg-program-contrast/10 [&::-webkit-details-marker]:hidden"
			aria-label={`Visit: ${visit.year} ${visit.label}. Choose a visit`}
		>
			<span class="font-mono">{visit.year}</span>
			<span class="hidden min-[400px]:inline">· {visit.label}</span>
			<ChevronDown class="size-3.5 opacity-80" />
		</summary>
		<div class="absolute right-0 top-full z-50 mt-2 w-[min(88vw,18rem)] border border-rule bg-paper p-1.5 text-ink shadow-xl lg:left-0 lg:right-auto">
			<p class="px-2.5 pb-1.5 pt-1 font-mono text-[11px] text-ink-soft">{program.code} visits</p>
			<ul>
				{#each visits as item (item.slug)}
					{@const current = item.slug === visit.slug}
					<li>
						<a
							href={visitBase(program, item)}
							class="flex items-center justify-between gap-3 px-2.5 py-2 text-[13px] transition-colors hover:bg-program-soft"
							aria-current={current ? 'page' : undefined}
						>
							<span>
								<span class="font-mono">{item.year}</span> · {item.label}
								{#if item.status === 'active'}
									<span class="ml-1 border border-program/40 px-1 py-px font-mono text-[10px] text-program-ink">current</span>
								{/if}
							</span>
							{#if current}
								<Check class="size-4 text-program" />
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		</div>
	</details>
{/snippet}

<!--
	The header is fixed over a spacer that keeps its tall size, so shrinking it never moves the page
	(moving the page changed the scroll position and made the header jump back and forth).
	Program pages add a second row on phones and tablets, where the header stays compact.
-->
<div class="{current ? 'h-28' : 'h-16 lg:h-28'} print:hidden" aria-hidden="true"></div>
<header
	{style}
	class="fixed inset-x-0 top-0 z-40 border-b print:hidden transition-[background-color,box-shadow,border-color] duration-500 ease-out {current
		? `program-scope on-program text-program-contrast ${compact
				? 'border-black/15 bg-[color-mix(in_srgb,var(--program)_86%,black)] shadow-[0_10px_28px_-18px_rgb(0_0_0/0.6)]'
				: 'border-transparent bg-program/92 backdrop-blur-sm'}`
		: `text-ink ${compact
				? 'border-rule bg-[color-mix(in_srgb,var(--salt)_90%,var(--ink))]/95 shadow-[0_8px_24px_-18px_rgb(0_0_0/0.45)] backdrop-blur'
				: 'border-transparent bg-paper/85 backdrop-blur-sm'}`}"
>
	<div class="mx-auto flex max-w-[1280px] items-center gap-3 px-5 transition-[height] duration-500 ease-out will-change-[height] sm:px-8 {compact ? 'h-16' : 'h-16 lg:h-28'}">
		<!-- Logo (and program code) start larger and settle to their usual size; a transform, so nothing reflows. -->
		<div class="flex min-w-0 origin-left items-center gap-3 transition-transform duration-500 ease-out will-change-transform {compact ? 'scale-100' : 'scale-100 lg:scale-[1.35]'}">
			<Logo compact class="shrink-0" />
			{#if current}
				<span class="hidden h-7 w-px bg-program-contrast/25 sm:block" aria-hidden="true"></span>
				<a href={base} class="flex min-w-0 items-baseline gap-2.5 hover:opacity-90">
					<span class="font-display text-[19px] font-semibold tracking-[-0.03em]">{program.code}</span>
					<span class="hidden truncate text-[13px] opacity-80 xl:inline">{program.name}</span>
				</a>
			{/if}
		</div>

		<!-- The theme button stays at the far right for everyone; Manage appears to its left for staff. -->
		<div class="ml-auto flex items-center gap-2">
			{#if current}
				<a
					href={`${base}/documents`}
					class="hidden h-9 items-center gap-2 px-3 text-[13px] font-medium transition-colors hover:bg-program-contrast/10 lg:inline-flex"
				>
					<Search class="size-4" />
					Search
				</a>
				<div class="hidden lg:block">{@render visitSelector()}</div>
				<ManageLink compact class="border border-program-contrast/35 px-2 hover:bg-program-contrast/10 sm:px-3" />
				<ThemeToggle class="hover:bg-program-contrast/10" />
			{:else}
				<ManageLink class="h-10 bg-ink text-paper hover:bg-ink-soft sm:px-4" />
				<ThemeToggle class="text-ink hover:bg-ink/8" />
			{/if}
		</div>
	</div>

	{#if current}
	<!-- Mobile and tablet: sections drawer, visit selector, search. -->
	<div class="border-t border-program-contrast/20 lg:hidden">
		<div class="mx-auto flex h-12 max-w-[1280px] items-center gap-2 px-5 sm:px-8">
			<Sheet.Root bind:open={drawerOpen}>
				<Sheet.Trigger
					class="inline-flex h-9 items-center gap-2 border border-program-contrast/35 px-3 text-[13px] font-medium transition-colors hover:bg-program-contrast/10"
				>
					<PanelLeft class="size-4" />
					Sections
				</Sheet.Trigger>
				<Sheet.Content side="left" class="program-scope w-[88vw] max-w-sm gap-0 overflow-y-auto bg-salt p-0"
					{style}
					showCloseButton={false}
				>
					<div class="on-program relative bg-program px-5 pb-4 pt-5 text-program-contrast">
						<Sheet.Close
							class="absolute right-3 top-3 grid size-9 place-items-center transition-colors hover:bg-program-contrast/10"
							aria-label="Close sections"
						>
							<X class="size-4" />
						</Sheet.Close>
						<Sheet.Title class="font-display text-[22px] font-semibold tracking-[-0.03em] text-program-contrast">
							{program.code} sections
						</Sheet.Title>
						<Sheet.Description class="mt-1 text-[12px] text-program-contrast/80">
							{visit.year} · {visit.label}
						</Sheet.Description>
					</div>
					<div class="p-3">
						<SectionNav {program} {visit} {base} onnavigate={() => (drawerOpen = false)} />
					</div>
				</Sheet.Content>
			</Sheet.Root>

			<div class="ml-auto flex items-center gap-1">
				<a
					href={`${base}/documents`}
					class="grid size-9 place-items-center transition-colors hover:bg-program-contrast/10"
					aria-label={`Search ${program.code} documents`}
				>
					<Search class="size-4" />
				</a>
				{@render visitSelector()}
			</div>
		</div>
	</div>
	{/if}
</header>
