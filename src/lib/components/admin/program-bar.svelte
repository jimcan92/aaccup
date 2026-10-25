<script lang="ts">
	import { goto } from '$app/navigation';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import { fresh } from '#lib/fresh-link.js';
	import { pageBar, type BarAction } from '#lib/page-bar.svelte.js';
	import { tick, type Component } from 'svelte';

	type Tab = { label: string; href: string; active: boolean; icon: Component };

	// The tabs, then the page's buttons on the right. Buttons that do not fit move into More,
	// the leftmost first, so the main action stays in view.
	let { tabs }: { tabs: Tab[] } = $props();

	const actions = $derived(pageBar.actions);
	let rowWidth = $state(0);
	let tabsWidth = $state(0);
	let measure = $state<HTMLDivElement>();
	let widths = $state<number[]>([]);

	// Measure every button at full size (a hidden copy), again whenever a label changes.
	$effect(() => {
		void actions.map((action) => `${action.id}:${action.label}`).join();
		void tick().then(() => {
			widths = measure ? [...measure.children].map((child) => child.getBoundingClientRect().width) : [];
		});
	});

	const GAP = 8;
	const MORE = 40;
	const shown = $derived.by(() => {
		const room = rowWidth - tabsWidth - 16;
		if (widths.length !== actions.length || !rowWidth) return actions.length;
		const all = widths.reduce((sum, width) => sum + width + GAP, 0);
		if (all <= room) return actions.length;
		let used = MORE;
		let count = 0;
		for (let index = actions.length - 1; index >= 0; index--) {
			if (used + widths[index] + GAP > room) break;
			used += widths[index] + GAP;
			count++;
		}
		return count;
	});
	const visible = $derived(actions.slice(actions.length - shown));
	const hidden = $derived(actions.slice(0, actions.length - shown));

	function run(action: BarAction) {
		if (action.onclick) action.onclick();
		else if (action.href && action.external) {
			const url = new URL(action.href, location.href);
			url.searchParams.set('fresh', String(Date.now()));
			window.open(url, '_blank', 'noopener,noreferrer');
		} else if (action.href) goto(action.href);
	}

	const base = 'inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap px-4 text-[13px] font-medium';
	const look = (action: BarAction) =>
		action.primary ? 'bg-ink text-paper hover:bg-ink-soft' : `border bg-paper ${action.pressed ? 'border-ink' : 'border-rule hover:border-ink/30'}`;
</script>

{#snippet button(action: BarAction, measuring = false)}
	{@const Icon = action.icon}
	{#if action.href && !action.onclick}
		{#if action.external}
			<a href={action.href} use:fresh target="_blank" rel="noopener noreferrer" class="{base} {look(action)}" tabindex={measuring ? -1 : undefined}>
				{action.label}{#if Icon}<Icon class="size-4" />{/if}
			</a>
		{:else}
			<a href={action.href} class="{base} {look(action)}" tabindex={measuring ? -1 : undefined}>{#if Icon}<Icon class="size-4" />{/if}{action.label}</a>
		{/if}
	{:else}
		<button type="button" onclick={action.onclick} class="{base} {look(action)}" aria-pressed={action.pressed} tabindex={measuring ? -1 : undefined}>
			{#if Icon}<Icon class="size-4" />{/if}{action.label}
		</button>
	{/if}
{/snippet}

<div bind:clientWidth={rowWidth} class="relative flex h-full items-center gap-2">
	<nav bind:clientWidth={tabsWidth} class="flex h-full shrink-0 gap-1" aria-label="Program sections">
		{#each tabs as item (item.label)}
			{@const Icon = item.icon}
			<a href={item.href} data-sveltekit-noscroll aria-current={item.active ? 'page' : undefined} class="inline-flex h-full items-center gap-2 border-b-2 px-3 text-[14px] font-medium sm:px-4 {item.active ? 'border-ink text-ink' : 'border-transparent text-ink-soft hover:text-ink'}">
				<Icon class="size-4" /> {item.label}
			</a>
		{/each}
	</nav>

	<div class="ml-auto flex items-center gap-2">
		{#if hidden.length}
			<DropdownMenu.Root>
				<DropdownMenu.Trigger class="grid size-10 shrink-0 cursor-pointer place-items-center border border-rule bg-paper hover:border-ink/30" aria-label="More actions" title="More">
					<Ellipsis class="size-4" />
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end" class="min-w-52 rounded-none">
					{#each hidden as action (action.id)}
						{@const Icon = action.icon}
						<DropdownMenu.Item onSelect={() => run(action)} class="cursor-pointer gap-2 rounded-none text-[13px]">
							{#if Icon}<Icon class="size-4" />{/if}{action.label}
						</DropdownMenu.Item>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		{/if}
		{#each visible as action (action.id)}{@render button(action)}{/each}
	</div>

	<!-- Full-size copies to measure; never seen or reached. -->
	<div bind:this={measure} class="pointer-events-none invisible absolute left-0 top-0 flex gap-2" aria-hidden="true" inert>
		{#each actions as action (action.id)}{@render button(action, true)}{/each}
	</div>
</div>
