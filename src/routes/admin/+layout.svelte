<script lang="ts">
	import { page } from '$app/state';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
	import Images from '@lucide/svelte/icons/images';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Type from '@lucide/svelte/icons/type';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const nav = [
		{ href: '/admin', label: 'Overview', icon: LayoutDashboard },
		{ href: '/admin/content', label: 'Content', icon: Type },
		{ href: '/admin/carousel', label: 'Carousel', icon: Images, soon: true },
		{ href: '/admin/review', label: 'Review', icon: ClipboardCheck, soon: true }
	];

	function active(href: string) {
		return href === '/admin' ? page.url.pathname === '/admin' : page.url.pathname.startsWith(href);
	}
</script>

<svelte:head>
	<meta name="robots" content="noindex, nofollow" />
	<title>Admin · AACCUP 2026</title>
</svelte:head>

{#if data.isLogin || !data.user}
	{@render children()}
{:else}
	<div class="min-h-screen bg-salt text-ink">
		<aside class="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-ink text-paper lg:flex">
			<div class="border-b border-paper/10 px-6 py-6">
				<a href="/" class="inline-flex items-center gap-3">
					<span class="grid size-8 place-items-center border border-paper/25 font-display text-[13px] font-semibold">
						CM
					</span>
					<span>
						<span class="block font-display text-[14px] font-semibold tracking-[-0.02em]">AACCUP Admin</span>
						<span class="mt-0.5 block text-[9px] text-paper/45">CTU Moalboal</span>
					</span>
				</a>
			</div>

			<nav class="flex-1 px-3 py-5" aria-label="Admin sections">
				{#each nav as item (item.href)}
					{@const Icon = item.icon}
					{#if item.soon}
						<span class="flex items-center gap-3 px-3 py-2.5 text-[12px] text-paper/30">
							<Icon class="size-4" />
							{item.label}
							<span class="ml-auto font-mono text-[8px] text-paper/25">Soon</span>
						</span>
					{:else}
						<a
							href={item.href}
							class="flex items-center gap-3 px-3 py-2.5 text-[12px] transition-colors {active(item.href)
								? 'bg-paper/10 text-paper'
								: 'text-paper/55'}"
							aria-current={active(item.href) ? 'page' : undefined}
						>
							<Icon class="size-4" />
							{item.label}
						</a>
					{/if}
				{/each}
			</nav>

			<div class="border-t border-paper/10 p-5">
				<p class="text-[11px] font-medium text-paper/80">{data.profile?.full_name || data.user.email}</p>
				<p class="mt-1 font-mono text-[9px] text-paper/40">{data.profile?.role ?? 'no role'}</p>
				<form method="POST" action="/admin/logout" class="mt-4">
					<button
						type="submit"
						class="inline-flex w-full items-center justify-between border border-paper/20 px-3 py-2 text-[10px] text-paper/65 transition-colors hover:bg-paper hover:text-ink"
					>
						Sign out
						<LogOut class="size-3.5" />
					</button>
				</form>
				<a href="/" class="mt-3 inline-flex items-center gap-1 text-[9px] text-paper/35 hover:text-paper">
					View the public site
					<ArrowUpRight class="size-3" />
				</a>
			</div>
		</aside>

		<div class="lg:pl-64">
			<header class="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-rule bg-salt/90 px-5 backdrop-blur-md lg:hidden">
				<span class="font-display text-[13px] font-semibold">AACCUP Admin</span>
				<form method="POST" action="/admin/logout">
					<button type="submit" class="text-[10px] text-ink-soft">Sign out</button>
				</form>
			</header>

			<nav class="flex gap-1 overflow-x-auto border-b border-rule bg-paper px-5 py-2 lg:hidden" aria-label="Admin sections">
				{#each nav as item (item.href)}
					{#if !item.soon}
						<a
							href={item.href}
							class="shrink-0 px-3 py-1.5 text-[10px] font-medium"
							class:bg-ink={active(item.href)}
							class:text-paper={active(item.href)}
							class:text-ink-soft={!active(item.href)}
						>
							{item.label}
						</a>
					{/if}
				{/each}
			</nav>

			<main class="mx-auto max-w-[1100px] px-5 py-8 sm:px-8 lg:py-12">
				{@render children()}
			</main>
		</div>
	</div>
{/if}
