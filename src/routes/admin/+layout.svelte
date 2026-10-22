<script lang="ts">
	import { page } from '$app/state';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import FolderOpen from '@lucide/svelte/icons/folder-open';
	import House from '@lucide/svelte/icons/house';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Menu from '@lucide/svelte/icons/menu';
	import Type from '@lucide/svelte/icons/type';
	import Users from '@lucide/svelte/icons/users';
	import X from '@lucide/svelte/icons/x';
	import AdminQuickActions from '$lib/components/admin/admin-quick-actions.svelte';
	import BrandMarks from '$lib/components/site/brand-marks.svelte';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { fresh } from '$lib/fresh-link';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { initials, roleInfo } from '$lib/admin';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
	let menuOpen = $state(false);

	const nav = $derived(
		[
			{ href: '/admin', label: 'Overview', icon: LayoutDashboard },
			{ href: '/admin/programs', label: 'Programs', icon: FolderOpen },
			{ href: '/admin/home', label: 'Home page', icon: House },
			{ href: '/admin/content', label: 'Site content', icon: Type },
			data.staff?.role === 'admin' ? { href: '/admin/people', label: 'People', icon: Users } : null
		].filter((item) => item !== null)
	);

	function active(href: string) {
		return href === '/admin' ? page.url.pathname === '/admin' : page.url.pathname.startsWith(href);
	}
</script>

<svelte:head>
	<meta name="robots" content="noindex, nofollow" />
	<title>Admin · AACCUP · CTU Moalboal</title>
</svelte:head>

{#snippet navList()}
	<ul class="space-y-0.5">
		{#each nav as item (item.href)}
			{@const Icon = item.icon}
			{@const current = active(item.href)}
			<li>
				<a
					href={item.href}
					onclick={() => (menuOpen = false)}
					class="flex items-center gap-3 border-l-2 px-3 py-2.5 text-[14px] transition-colors {current
						? 'border-signal bg-paper/10 font-medium text-paper'
						: 'border-transparent text-paper/70 hover:bg-paper/5 hover:text-paper'}"
					aria-current={current ? 'page' : undefined}
				>
					<Icon class="size-4" />
					{item.label}
				</a>
			</li>
		{/each}
	</ul>
{/snippet}

{#snippet userCard()}
	{#if data.staff}
		<div class="flex items-center gap-3">
			<span class="grid size-10 shrink-0 place-items-center bg-paper/10 font-display text-[14px] font-semibold">
				{initials(data.staff.full_name || data.staff.email)}
			</span>
			<div class="min-w-0">
				<p class="truncate text-[13px] font-medium text-paper">{data.staff.full_name || data.staff.email}</p>
				<p class="truncate text-[12px] text-paper/55">{roleInfo[data.staff.role]?.label ?? data.staff.role}</p>
			</div>
		</div>
		<div class="mt-4 grid gap-1">
			<a href="/" use:fresh class="flex items-center justify-between px-1 py-1.5 text-[13px] text-paper/70 hover:text-paper">
				View public site
				<ArrowUpRight class="size-3.5" />
			</a>
			<a href={data.logoutUrl} class="flex items-center justify-between px-1 py-1.5 text-[13px] text-paper/70 hover:text-paper">
				Sign out of CTU Accounts
				<LogOut class="size-3.5" />
			</a>
		</div>
	{/if}
{/snippet}

{#snippet brand()}
	<a href="/admin" class="inline-flex items-center gap-3">
		<BrandMarks size={34} />
		<span class="leading-none">
			<span class="block font-display text-[15px] font-semibold tracking-[-0.02em]">AACCUP Desk</span>
			<span class="mt-1 block text-[11px] text-paper/55">CTU Moalboal task force</span>
		</span>
	</a>
{/snippet}

<!-- Form results show here, lower right, wherever the page is scrolled. -->
<Toaster position="bottom-right" richColors closeButton />

{#if data.isLogin}
	{@render children()}
{:else}
	<div class="min-h-dvh bg-salt text-ink">
		<aside class="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-ink text-paper lg:flex" style="--ring: #c9973a">
			<div class="px-5 py-6">{@render brand()}</div>
			<nav class="flex-1 overflow-y-auto px-2 py-2" aria-label="Admin">{@render navList()}</nav>
			<div class="border-t border-paper/10 p-5">{@render userCard()}</div>
		</aside>

		<header
			class="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 bg-ink px-5 text-paper lg:hidden"
			style="--ring: #c9973a"
		>
			{@render brand()}
			<Sheet.Root bind:open={menuOpen}>
				<Sheet.Trigger
					class="inline-flex h-10 items-center gap-2 border border-paper/25 px-3 text-[13px] font-medium"
					aria-label="Open admin menu"
				>
					<Menu class="size-4" />
					Menu
				</Sheet.Trigger>
				<Sheet.Content
					side="left"
					showCloseButton={false}
					class="w-[86vw] max-w-xs gap-0 border-none bg-ink p-0 text-paper"
					style="--ring: #c9973a"
				>
					<div class="flex items-center justify-between px-5 py-5">
						<Sheet.Title class="font-display text-[18px] font-semibold text-paper">Admin menu</Sheet.Title>
						<Sheet.Close class="grid size-9 place-items-center hover:bg-paper/10" aria-label="Close menu">
							<X class="size-4" />
						</Sheet.Close>
					</div>
					<Sheet.Description class="sr-only">Admin sections and account</Sheet.Description>
					<nav class="flex-1 px-2" aria-label="Admin">{@render navList()}</nav>
					<div class="mt-auto border-t border-paper/10 p-5">{@render userCard()}</div>
				</Sheet.Content>
			</Sheet.Root>
		</header>

		<div class="lg:pl-64">
			<main id="main" class="mx-auto max-w-[1120px] px-5 py-8 sm:px-8 lg:py-12">
				{@render children()}
			</main>
		</div>
		<AdminQuickActions />
	</div>
{/if}
