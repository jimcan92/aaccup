<script lang="ts">
	import { page } from '$app/state';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import FolderOpen from '@lucide/svelte/icons/folder-open';
	import House from '@lucide/svelte/icons/house';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Menu from '@lucide/svelte/icons/menu';
	import Users from '@lucide/svelte/icons/users';
	import X from '@lucide/svelte/icons/x';
	import AdminQuickActions from '#lib/components/admin/admin-quick-actions.svelte';
	import { adminUi } from '#lib/admin-ui.svelte.js';
	import BrandMarks from '#lib/components/site/brand-marks.svelte';
	import * as Sheet from '#lib/components/ui/sheet/index.js';
	import { fresh } from '#lib/fresh-link.js';
	import { Toaster } from '#lib/components/ui/sonner/index.js';
	import { initials, roleInfo } from '#lib/admin.js';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
	let menuOpen = $state(false);

	const nav = $derived(
		[
			{ href: '/admin', label: 'Overview', icon: LayoutDashboard },
			{ href: '/admin/programs', label: 'Programs', icon: FolderOpen },
			{ href: '/admin/home', label: 'Home page', icon: House },
			data.staff?.role === 'admin' ? { href: '/admin/people', label: 'People', icon: Users } : null
		].filter((item) => item !== null)
	);

	// Public links from the admin skip the CDN cache (see fresh-link.ts).
	function stampFresh(event: Event) {
		const link = event.currentTarget as HTMLAnchorElement;
		const url = new URL(link.href, location.href);
		url.searchParams.set('fresh', String(Date.now()));
		link.href = url.pathname + url.search + url.hash;
	}

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

<!-- Desktop rail: icons only; the label shows on hover and is read by screen readers. -->
{#snippet railList()}
	<ul class="flex flex-col items-center gap-1">
		{#each nav as item (item.href)}
			{@const Icon = item.icon}
			{@const current = active(item.href)}
			<li>
				<a
					href={item.href}
					class="group relative grid size-11 place-items-center transition-colors {current
						? 'bg-paper/12 text-paper shadow-[inset_2px_0_0_var(--color-signal)]'
						: 'text-paper/65 hover:bg-paper/8 hover:text-paper'}"
					aria-current={current ? 'page' : undefined}
				>
					<Icon class="size-[18px]" />
					<span class="sr-only">{item.label}</span>
					<span class="pointer-events-none absolute left-full top-1/2 z-40 ml-3 -translate-y-1/2 whitespace-nowrap bg-ink px-2.5 py-1.5 text-[12px] font-medium text-paper opacity-0 shadow-lg ring-1 ring-paper/15 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true">{item.label}</span>
				</a>
			</li>
		{/each}
	</ul>
{/snippet}

{#snippet railUser()}
	{#if data.staff}
		{@const name = data.staff.full_name || data.staff.email}
		<div class="flex flex-col items-center gap-1">
			<span class="grid size-10 place-items-center bg-paper/10 font-display text-[13px] font-semibold" title={`${name} · ${roleInfo[data.staff.role]?.label ?? data.staff.role}`}>
				{initials(name)}<span class="sr-only">{name}, {roleInfo[data.staff.role]?.label ?? data.staff.role}</span>
			</span>
			{#each [{ href: '/', label: 'View public site', icon: ArrowUpRight, isFresh: true }, { href: data.logoutUrl, label: 'Sign out of CTU Accounts', icon: LogOut, isFresh: false }] as link (link.label)}
				{@const Icon = link.icon}
				<a href={link.href} onpointerdown={link.isFresh ? stampFresh : undefined} class="group relative grid size-10 place-items-center text-paper/65 hover:bg-paper/8 hover:text-paper">
					<Icon class="size-4" />
					<span class="sr-only">{link.label}</span>
					<span class="pointer-events-none absolute left-full top-1/2 z-40 ml-3 -translate-y-1/2 whitespace-nowrap bg-ink px-2.5 py-1.5 text-[12px] font-medium text-paper opacity-0 shadow-lg ring-1 ring-paper/15 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true">{link.label}</span>
				</a>
			{/each}
		</div>
	{/if}
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
<Toaster position="bottom-right" theme="light" closeButton />

{#if data.isLogin}
	{@render children()}
{:else}
	<div class="min-h-dvh bg-salt text-ink">
		<!-- Full sidebar; while a block editor shows its side preview, an icon rail instead. -->
		{#if adminUi.compact}
			<aside class="fixed inset-y-0 left-0 z-30 hidden w-16 flex-col items-center bg-ink text-paper lg:flex" style="--ring: #c9973a">
				<a href="/admin" class="py-5" title="AACCUP Desk"><BrandMarks size={30} /><span class="sr-only">AACCUP Desk</span></a>
				<nav class="flex-1 py-2" aria-label="Admin">{@render railList()}</nav>
				<div class="w-full border-t border-paper/10 py-4">{@render railUser()}</div>
			</aside>
		{:else}
			<aside class="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-ink text-paper lg:flex" style="--ring: #c9973a">
				<div class="px-5 py-6">{@render brand()}</div>
				<nav class="flex-1 overflow-y-auto px-2 py-2" aria-label="Admin">{@render navList()}</nav>
				<div class="border-t border-paper/10 p-5">{@render userCard()}</div>
			</aside>
		{/if}

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

		<div class={adminUi.compact ? 'lg:pl-16' : 'lg:pl-64'}>
			<!-- Full width only while a block editor shows its side preview; otherwise the usual page width. -->
			<main id="main" class="mx-auto px-5 py-8 sm:px-8 lg:py-12 {adminUi.compact ? 'max-w-none' : 'max-w-[1120px]'}">
				{@render children()}
			</main>
		</div>
		<AdminQuickActions />
	</div>
{/if}
