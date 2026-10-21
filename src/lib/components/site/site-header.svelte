<script lang="ts">
	import { page } from '$app/state';
	import { programs } from '$lib/data/accreditation';
	import { nav, site } from '$lib/data/site';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import Menu from '@lucide/svelte/icons/menu';
	import Search from '@lucide/svelte/icons/search';
	import Logo from './logo.svelte';

	let open = $state(false);

	function isActive(href: string): boolean {
		if (href === '/#areas') return page.url.pathname === '/';
		return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
	}
</script>

<header class="sticky top-0 z-40 border-b border-rule bg-salt/90 backdrop-blur-md">
	<div class="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-5 sm:px-8">
		<Logo />

		<nav class="hidden items-center gap-6 md:flex" aria-label="Main navigation">
			{#each nav as item (item.href)}
				<a
					href={item.href}
					class="text-[12px] font-medium text-ink-soft transition-colors hover:text-ink"
					class:text-ink={isActive(item.href)}
					aria-current={isActive(item.href) ? 'page' : undefined}
				>
					{item.label}
				</a>
			{/each}
		</nav>

		<div class="flex items-center gap-2">
			<div class="hidden items-center gap-3 border-l border-rule pl-5 lg:flex">
				{#each programs as program (program.slug)}
					<a
						href={`/programs/${program.slug}`}
						class="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-soft transition-colors hover:text-ink"
					>
						<span class="size-1.5" style:background={program.accent} aria-hidden="true"></span>
						{program.code}
					</a>
				{/each}
			</div>

			<a
				href="/documents"
				class="hidden h-9 items-center gap-2 border border-ink/20 bg-transparent px-3 text-[11px] font-medium text-ink transition-colors hover:bg-ink hover:text-paper sm:inline-flex"
			>
				<Search class="size-3.5" />
				Find a document
			</a>

			<Sheet.Root bind:open>
				<Sheet.Trigger>
					{#snippet child({ props })}
						<button
							{...props}
							class="inline-flex size-9 items-center justify-center border border-rule text-ink transition-colors hover:bg-ink hover:text-paper md:hidden"
							aria-label="Open navigation menu"
						>
							<Menu class="size-4" />
						</button>
					{/snippet}
				</Sheet.Trigger>

				<Sheet.Content side="right" class="w-full border-l border-ink/10 bg-salt p-0 sm:max-w-sm">
					<Sheet.Header class="border-b border-rule p-6">
						<Sheet.Title class="font-display text-xl font-semibold tracking-[-0.03em]">
							AACCUP dossier
						</Sheet.Title>
						<Sheet.Description class="mt-1 text-xs text-ink-soft">
							{site.campus} · {site.level}
						</Sheet.Description>
					</Sheet.Header>

					<div class="overflow-y-auto p-6">
						<p class="font-mono text-[10px] text-ink-soft">Programs</p>
						<div class="mt-3 grid gap-2">
							{#each programs as program (program.slug)}
								<a
									href={`/programs/${program.slug}`}
									onclick={() => (open = false)}
									class="flex items-center justify-between border border-rule bg-paper p-3 transition-colors hover:bg-white"
								>
									<span class="flex items-center gap-3">
										<span class="size-2" style:background={program.accent} aria-hidden="true"></span>
										<span class="font-display text-lg font-semibold tracking-[-0.03em]">
											{program.code}
										</span>
										<span class="text-[10px] text-ink-soft">{program.level}</span>
									</span>
									<ArrowUpRight class="size-4 text-ink-soft" />
								</a>
							{/each}
						</div>

						<nav class="mt-8 flex flex-col divide-y divide-rule border-y border-rule" aria-label="Mobile navigation">
							{#each nav as item (item.href)}
								<a
									href={item.href}
									onclick={() => (open = false)}
									class="flex items-center justify-between py-4 text-sm font-medium text-ink"
								>
									{item.label}
									<ArrowUpRight class="size-4 text-ink-soft" />
								</a>
							{/each}
						</nav>

						<a
							href="/documents"
							onclick={() => (open = false)}
							class="mt-8 flex h-11 items-center justify-center gap-2 bg-ink text-sm text-paper transition-colors hover:bg-ink-soft"
						>
							<Search class="size-4" />
							Find a document
						</a>

						<p class="mt-6 text-[11px] leading-relaxed text-ink-soft">{site.driveNote}</p>
					</div>
				</Sheet.Content>
			</Sheet.Root>
		</div>
	</div>
</header>
