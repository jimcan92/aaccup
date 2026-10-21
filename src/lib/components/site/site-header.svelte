<script lang="ts">
	import { page } from '$app/state';
	import { programs } from '$lib/data/accreditation';
	import { homeNav, site } from '$lib/data/site';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import Check from '@lucide/svelte/icons/check';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Menu from '@lucide/svelte/icons/menu';
	import Search from '@lucide/svelte/icons/search';
	import { pad2 } from '$lib/format';
	import Logo from './logo.svelte';

	let open = $state(false);

	const active = $derived.by(() => {
		const first = page.url.pathname.split('/')[1];
		return programs.find((program) => program.slug === first) ?? null;
	});

	function isActive(href: string): boolean {
		return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
	}

	function targetFor(target: (typeof programs)[number]): string {
		if (!active) return `/${target.slug}`;
		const rest = page.url.pathname.slice(active.slug.length + 1);
		return `/${target.slug}${rest}`;
	}

	function closeMenu(event: MouseEvent) {
		const details = (event.currentTarget as HTMLElement).closest('details');
		details?.removeAttribute('open');
	}

	function closeDetailsOnOutside(node: HTMLElement) {
		function onPointer(event: MouseEvent) {
			if (!node.contains(event.target as Node)) node.removeAttribute('open');
		}

		function onKey(event: KeyboardEvent) {
			if (event.key === 'Escape') node.removeAttribute('open');
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

<header
	class="sticky top-0 z-40 border-b border-rule bg-salt/90 backdrop-blur-md"
	style:--accent={active?.accent ?? '#082A2C'}
>
	<div class="mx-auto flex h-16 max-w-[1280px] items-center gap-3 px-5 sm:px-8">
		<Logo />

		<details class="relative shrink-0" use:closeDetailsOnOutside>
			<summary
				class="inline-flex h-9 cursor-pointer list-none items-center gap-2 border border-rule bg-paper px-3 text-[11px] font-medium text-ink transition-colors hover:border-ink/30 [&::-webkit-details-marker]:hidden"
				aria-label="Choose a program volume"
			>
				{#if active}
					<span class="size-1.5" style:background={active.accent} aria-hidden="true"></span>
					{active.code}
				{:else}
					Choose volume
				{/if}
				<ChevronDown class="size-3.5 text-ink-soft" />
			</summary>

			<div class="absolute left-0 top-full z-50 mt-2 w-[min(92vw,22rem)] border border-rule bg-paper p-2 shadow-xl">
				{#each programs as program (program.slug)}
					<a
						href={targetFor(program)}
						onclick={closeMenu}
						class="flex items-start gap-3 p-3 transition-colors hover:bg-salt"
					>
						<span class="mt-1 size-2 shrink-0" style:background={program.accent} aria-hidden="true"></span>
						<span class="min-w-0 flex-1">
							<span class="flex items-center justify-between gap-2">
								<span class="font-display text-[16px] font-semibold tracking-[-0.03em]">{program.code}</span>
								{#if active?.slug === program.slug}
									<Check class="size-3.5" color={program.accent} />
								{/if}
							</span>
							<span class="mt-0.5 block text-[11px] leading-snug text-ink-soft">{program.name}</span>
							<span class="mt-1 block font-mono text-[9px] text-ink-soft">{program.level}</span>
						</span>
					</a>
				{/each}
			</div>
		</details>

		{#if active}
			<nav class="hidden items-center gap-4 lg:flex" aria-label="Current visit">
				{#each active.currentVisitAreas as area (area.slug)}
					<a
						href={`/${active.slug}/visit/${area.slug}`}
						class="border-b-2 border-transparent pb-0.5 text-[11px] font-medium text-ink-soft transition-colors hover:text-ink"
						style={isActive(`/${active.slug}/visit/${area.slug}`)
							? `border-color:${active.accent};color:${active.accent}`
							: ''}
						aria-current={isActive(`/${active.slug}/visit/${area.slug}`) ? 'page' : undefined}
					>
						{area.shortTitle}
					</a>
				{/each}
			</nav>

			<details class="relative hidden lg:block" use:closeDetailsOnOutside>
				<summary
					class="inline-flex h-9 cursor-pointer list-none items-center gap-1.5 border border-rule px-2.5 text-[11px] font-medium text-ink-soft transition-colors hover:text-ink [&::-webkit-details-marker]:hidden"
				>
					More
					<ChevronDown class="size-3.5" />
				</summary>

				<div class="absolute right-0 top-full z-50 mt-2 w-[min(92vw,36rem)] border border-rule bg-paper p-5 shadow-xl">
					<div class="grid gap-6 sm:grid-cols-[1.45fr_0.55fr]">
						<div>
							<p class="font-mono text-[9px] text-ink-soft">Previous visit — 10 areas</p>
							<div class="mt-3 grid grid-cols-2 gap-x-5">
								{#each active.areas as area (area.number)}
									<a
										href={`/${active.slug}/areas/${area.slug}`}
										onclick={closeMenu}
										class="flex items-start gap-2 border-b border-rule py-2 text-[11px] leading-snug text-ink-soft transition-colors hover:text-ink"
									>
										<span class="w-4 shrink-0 font-mono text-[9px]">{pad2(area.number)}</span>
										<span>{area.shortTitle}</span>
									</a>
								{/each}
							</div>
						</div>

						<div class="border-t border-rule pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
							<p class="font-mono text-[9px] text-ink-soft">Volume</p>
							<ul class="mt-3 space-y-3">
								<li>
									<a href={`/${active.slug}/records`} onclick={closeMenu} class="text-[11px] font-medium text-ink">
										Records
									</a>
								</li>
								<li>
									<a href={`/${active.slug}/documents`} onclick={closeMenu} class="text-[11px] font-medium text-ink">
										Documents
									</a>
								</li>
								<li>
									<a href={`/${active.slug}/about`} onclick={closeMenu} class="text-[11px] font-medium text-ink">
										About the visit
									</a>
								</li>
								<li>
									<a href="/" onclick={closeMenu} class="inline-flex items-center gap-1 text-[11px] text-ink-soft">
										All volumes
										<ArrowUpRight class="size-3" />
									</a>
								</li>
							</ul>
						</div>
					</div>
				</div>
			</details>
		{:else}
			<nav class="hidden items-center gap-5 lg:flex" aria-label="Campus sections">
				{#each homeNav as item (item.href)}
					<a href={item.href} class="text-[11px] font-medium text-ink-soft transition-colors hover:text-ink">
						{item.label}
					</a>
				{/each}
			</nav>
		{/if}

		<div class="ml-auto flex items-center gap-2">
			{#if active}
				<a
					href={`/${active.slug}/documents`}
					class="hidden h-9 items-center gap-2 border border-ink/20 px-3 text-[11px] font-medium text-ink transition-colors hover:bg-ink hover:text-paper sm:inline-flex"
					aria-label={`Search ${active.code} documents`}
				>
					<Search class="size-3.5" />
					<span class="hidden xl:inline">Search</span>
				</a>
			{/if}

			<Sheet.Root bind:open>
				<Sheet.Trigger>
					{#snippet child({ props })}
						<button
							{...props}
							class="inline-flex size-9 items-center justify-center border border-rule text-ink transition-colors hover:bg-ink hover:text-paper lg:hidden"
							aria-label="Open navigation menu"
						>
							<Menu class="size-4" />
						</button>
					{/snippet}
				</Sheet.Trigger>

				<Sheet.Content side="right" class="w-full border-l border-ink/10 bg-salt p-0 sm:max-w-sm">
					<Sheet.Header class="border-b border-rule p-6">
						<Sheet.Title class="font-display text-xl font-semibold tracking-[-0.03em]">
							AACCUP 2026
						</Sheet.Title>
						<Sheet.Description class="mt-1 text-xs text-ink-soft">
							{site.campus}
						</Sheet.Description>
					</Sheet.Header>

					<div class="overflow-y-auto p-6">
						<p class="font-mono text-[9px] text-ink-soft">
							{active ? 'Program volume' : 'Choose a volume'}
						</p>
						<div class="mt-3 grid gap-2">
							{#each programs as program (program.slug)}
								<a
									href={targetFor(program)}
									onclick={() => (open = false)}
									class="flex items-center justify-between border border-rule bg-paper p-3 transition-colors hover:bg-white"
								>
									<span class="flex min-w-0 items-center gap-3">
										<span class="size-2 shrink-0" style:background={program.accent} aria-hidden="true"></span>
										<span class="min-w-0">
											<span class="block font-display text-[17px] font-semibold tracking-[-0.03em]">
												{program.code}
											</span>
											<span class="mt-0.5 block truncate text-[10px] text-ink-soft">{program.name}</span>
										</span>
									</span>
									{#if active?.slug === program.slug}
										<Check class="size-4 shrink-0" color={program.accent} />
									{:else}
										<ArrowUpRight class="size-4 shrink-0 text-ink-soft" />
									{/if}
								</a>
							{/each}
						</div>

						{#if active}
							<p class="mt-7 font-mono text-[9px] text-ink-soft">Current visit</p>
							<nav class="mt-2 flex flex-col border-y border-rule" aria-label="Current visit">
								{#each active.currentVisitAreas as area (area.slug)}
									<a
										href={`/${active.slug}/visit/${area.slug}`}
										onclick={() => (open = false)}
										class="flex items-center justify-between border-b border-rule py-3 text-[13px] font-medium text-ink last:border-0"
									>
										{area.title}
										<ArrowUpRight class="size-3.5 text-ink-soft" />
									</a>
								{/each}
							</nav>

							<details class="mt-6 border-y border-rule">
								<summary class="flex cursor-pointer list-none items-center justify-between py-3 text-[12px] font-medium text-ink [&::-webkit-details-marker]:hidden">
									Previous visit — 10 areas
									<ChevronDown class="size-4 text-ink-soft" />
								</summary>
								<div class="grid grid-cols-2 gap-x-4 pb-4">
									{#each active.areas as area (area.number)}
										<a
											href={`/${active.slug}/areas/${area.slug}`}
											onclick={() => (open = false)}
											class="border-b border-rule py-2 text-[10px] leading-snug text-ink-soft"
										>
											<span class="mr-1 font-mono text-[9px]">{pad2(area.number)}</span>
											{area.shortTitle}
										</a>
									{/each}
								</div>
							</details>

							<div class="mt-6 grid gap-2">
								<a href={`/${active.slug}/records`} onclick={() => (open = false)} class="flex items-center justify-between border border-rule bg-paper p-3 text-[12px] font-medium text-ink">
									Records
									<ArrowUpRight class="size-3.5 text-ink-soft" />
								</a>
								<a href={`/${active.slug}/documents`} onclick={() => (open = false)} class="flex items-center justify-between border border-rule bg-paper p-3 text-[12px] font-medium text-ink">
									Documents
									<Search class="size-3.5 text-ink-soft" />
								</a>
								<a href={`/${active.slug}/about`} onclick={() => (open = false)} class="flex items-center justify-between border border-rule bg-paper p-3 text-[12px] font-medium text-ink">
									About the visit
									<ArrowUpRight class="size-3.5 text-ink-soft" />
								</a>
							</div>
						{:else}
							<nav class="mt-7 flex flex-col border-y border-rule" aria-label="Campus sections">
								{#each homeNav as item (item.href)}
									<a
										href={item.href}
										onclick={() => (open = false)}
										class="flex items-center justify-between border-b border-rule py-3 text-[13px] font-medium text-ink last:border-0"
									>
										{item.label}
										<ArrowUpRight class="size-3.5 text-ink-soft" />
									</a>
								{/each}
							</nav>
						{/if}

						<p class="mt-6 text-[10px] leading-relaxed text-ink-soft">{site.driveNote}</p>
					</div>
				</Sheet.Content>
			</Sheet.Root>
		</div>
	</div>
</header>
