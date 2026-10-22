<script lang="ts">
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import Check from '@lucide/svelte/icons/check';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import PanelLeft from '@lucide/svelte/icons/panel-left';
	import Search from '@lucide/svelte/icons/search';
	import X from '@lucide/svelte/icons/x';
	import Logo from '$lib/components/site/logo.svelte';
	import ManageLink from '$lib/components/site/manage-link.svelte';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { visitBase } from '$lib/data/accreditation';
	import type { Program, Visit } from '$lib/data/types';
	import { portalUrl } from '$lib/portal';
	import SectionNav from './section-nav.svelte';

	let {
		program,
		visit,
		base,
		style
	}: {
		program: Program;
		visit: Visit;
		base: string;
		/** Theme variables, repeated on the drawer because it is portalled outside the layout. */
		style: string;
	} = $props();

	let drawerOpen = $state(false);

	const visits = $derived([...program.visits].sort((a, b) => b.year - a.year));

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

<header class="on-program sticky top-0 z-40 bg-program text-program-contrast shadow-[0_1px_0_rgb(0_0_0/0.15)]">
	<div class="mx-auto flex h-16 max-w-[1280px] items-center gap-3 px-5 sm:px-8">
		<Logo compact class="shrink-0" />

		<span class="hidden h-7 w-px bg-program-contrast/25 sm:block" aria-hidden="true"></span>

		<a href={base} class="flex min-w-0 items-baseline gap-2.5 hover:opacity-90">
			<span class="font-display text-[19px] font-semibold tracking-[-0.03em]">{program.code}</span>
			<span class="hidden truncate text-[13px] opacity-80 xl:inline">{program.name}</span>
		</a>

		<div class="ml-auto flex items-center gap-2">
			<div class="hidden lg:block">{@render visitSelector()}</div>

			<a
				href={`${base}/documents`}
				class="hidden h-9 items-center gap-2 px-3 text-[13px] font-medium transition-colors hover:bg-program-contrast/10 lg:inline-flex"
			>
				<Search class="size-4" />
				Search
			</a>

			<ManageLink compact class="border border-program-contrast/35 px-2 hover:bg-program-contrast/10 sm:px-3" />

			<a
				href={portalUrl()}
				class="inline-flex h-9 items-center gap-1.5 px-2 text-[13px] font-medium transition-colors hover:bg-program-contrast/10 sm:px-3"
			>
				<span class="sm:hidden">Portal</span>
				<span class="hidden sm:inline">CTU Moalboal portal</span>
				<ArrowUpRight class="size-3.5" />
			</a>
		</div>
	</div>

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
				{@render visitSelector()}
				<a
					href={`${base}/documents`}
					class="grid size-9 place-items-center transition-colors hover:bg-program-contrast/10"
					aria-label={`Search ${program.code} documents`}
				>
					<Search class="size-4" />
				</a>
			</div>
		</div>
	</div>
</header>
