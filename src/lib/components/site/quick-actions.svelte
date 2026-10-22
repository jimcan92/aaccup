<script lang="ts" module>
	import type { Component } from 'svelte';

	/** A shortcut in the floating menu; `fresh` marks public pages opened from the admin (skips the CDN cache). */
	export type QuickAction = { label: string; href: string; icon: Component; fresh?: boolean };
	/** A titled group of shortcuts; empty groups are not shown. */
	export type QuickGroup = { title: string; items: QuickAction[] };
</script>

<script lang="ts">
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import X from '@lucide/svelte/icons/x';
	import { fly } from 'svelte/transition';
	import { cn } from '$lib/utils';

	// A floating button in the corner: Back to top, plus shortcuts that depend on the page.
	let { groups, class: className = '' }: { groups: QuickGroup[]; class?: string } = $props();

	const shown = $derived(groups.filter((group) => group.items.length));

	const id = $props.id();
	let open = $state(false);
	let scrolled = $state(0);
	let root = $state<HTMLElement>();

	function toTop() {
		open = false;
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
	}

	function stampFresh(event: Event) {
		const link = event.currentTarget as HTMLAnchorElement;
		const url = new URL(link.href, location.href);
		url.searchParams.set('fresh', String(Date.now()));
		link.href = url.pathname + url.search + url.hash;
	}
</script>

<svelte:window
	bind:scrollY={scrolled}
	onkeydown={(event) => event.key === 'Escape' && (open = false)}
	onpointerdown={(event) => open && root && !root.contains(event.target as Node) && (open = false)}
/>

<div bind:this={root} class="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2 print:hidden sm:bottom-6 sm:right-6">
	{#if open}
		<div
			id={`${id}-menu`}
			transition:fly={{ y: 8, duration: 150 }}
			class="max-h-[min(70dvh,34rem)] w-72 overflow-y-auto border border-rule bg-paper py-1.5 text-ink shadow-[0_12px_32px_-12px_rgb(0_0_0/0.35)]"
		>
			{#if scrolled > 200}
				<button type="button" onclick={toTop} class="flex w-full cursor-pointer items-center gap-3 border-b border-rule px-4 py-2.5 text-left text-[14px] hover:bg-salt">
					<ArrowUp class="size-4 shrink-0 text-ink-soft" /> Back to top
				</button>
			{/if}
			{#each shown as group, index (group.title)}
				<p class="px-4 pb-1 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft {index === 0 ? 'pt-2' : 'mt-1 border-t border-rule pt-3'}">{group.title}</p>
				<ul>
					{#each group.items as item (item.href + item.label)}
						{@const Icon = item.icon}
						<li>
							<a
								href={item.href}
								onclick={() => (open = false)}
								onpointerdown={item.fresh ? stampFresh : undefined}
								class="flex items-center gap-3 px-4 py-2 text-[14px] hover:bg-salt"
							>
								<Icon class="size-4 shrink-0 text-ink-soft" /> {item.label}
							</a>
						</li>
					{/each}
				</ul>
			{/each}
		</div>
	{/if}

	<!-- Back to top sits above the menu button, centred on it. -->
	<div class="flex flex-col items-center gap-2">
		{#if scrolled > 600 && !open}
			<button
				type="button"
				onclick={toTop}
				transition:fly={{ y: 8, duration: 150 }}
				class={cn('grid size-12 cursor-pointer place-items-center border border-rule bg-paper text-ink shadow-[0_8px_24px_-12px_rgb(0_0_0/0.4)] hover:bg-salt')}
				aria-label="Back to top"
			>
				<ArrowUp class="size-5" />
			</button>
		{/if}
		<button
			type="button"
			onclick={() => (open = !open)}
			class={cn('grid size-12 cursor-pointer place-items-center shadow-[0_10px_28px_-10px_rgb(0_0_0/0.5)] transition-transform hover:scale-105', className)}
			aria-expanded={open}
			aria-controls={`${id}-menu`}
			aria-label={open ? 'Close quick actions' : 'Quick actions'}
		>
			{#if open}<X class="size-5" />{:else}<Ellipsis class="size-5" />{/if}
		</button>
	</div>
</div>
