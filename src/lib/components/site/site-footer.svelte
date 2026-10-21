<script lang="ts">
	import { page } from '$app/state';
	import { programs } from '$lib/data/accreditation';
	import { homeNav, site } from '$lib/data/site';
	import { pad2 } from '$lib/format';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import Logo from './logo.svelte';

	const active = $derived.by(() => {
		const first = page.url.pathname.split('/')[1];
		return programs.find((program) => program.slug === first) ?? null;
	});
</script>

<footer class="bg-ink text-paper">
	<div class="mx-auto max-w-[1280px] px-5 py-14 sm:px-8">
		<div class="grid gap-10 border-b border-paper/10 pb-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
			<div>
				<Logo tone="dark" />
				{#if active}
					<p class="mt-5 font-display text-[20px] font-semibold leading-tight tracking-[-0.03em]">
						{active.code} · {active.level}
					</p>
					<p class="mt-1 text-[11px] text-paper/45">{active.name}</p>
					<p class="mt-4 max-w-xs text-[12px] leading-relaxed text-paper/55">
						{active.summary}
					</p>
				{:else}
					<p class="mt-5 max-w-xs text-[12px] leading-relaxed text-paper/55">{site.intro}</p>
				{/if}
			</div>

			{#if active}
				<div>
					<p class="font-mono text-[9px] text-paper/40">Current visit</p>
					<ul class="mt-4 space-y-3">
						{#each active.currentVisitAreas as area (area.slug)}
							<li>
								<a
									href={`/${active.slug}/visit/${area.slug}`}
									class="text-[12px] text-paper/75 transition-colors hover:text-paper"
								>
									{area.title}
								</a>
							</li>
						{/each}
					</ul>
				</div>

				<div>
					<p class="font-mono text-[9px] text-paper/40">Previous visit — 10 areas</p>
					<div class="mt-4 grid grid-cols-2 gap-x-4">
						{#each active.areas as area (area.number)}
							<a
								href={`/${active.slug}/areas/${area.slug}`}
								class="border-b border-paper/10 py-1.5 text-[10px] leading-snug text-paper/60 transition-colors hover:text-paper"
							>
								<span class="mr-1 font-mono text-[8px] text-paper/35">{pad2(area.number)}</span>
								{area.shortTitle}
							</a>
						{/each}
					</div>
				</div>

				<div>
					<p class="font-mono text-[9px] text-paper/40">Volume</p>
					<ul class="mt-4 space-y-3">
						<li>
							<a href={`/${active.slug}/records`} class="text-[12px] text-paper/75 transition-colors hover:text-paper">
								Records
							</a>
						</li>
						<li>
							<a href={`/${active.slug}/documents`} class="text-[12px] text-paper/75 transition-colors hover:text-paper">
								Documents
							</a>
						</li>
						<li>
							<a href={`/${active.slug}/about`} class="text-[12px] text-paper/75 transition-colors hover:text-paper">
								About the visit
							</a>
						</li>
						<li>
							<a href="/" class="inline-flex items-center gap-1 text-[12px] text-paper/55 transition-colors hover:text-paper">
								All volumes
								<ArrowUpRight class="size-3" />
							</a>
						</li>
					</ul>
				</div>
			{:else}
				<div>
					<p class="font-mono text-[9px] text-paper/40">Volumes</p>
					<ul class="mt-4 space-y-3">
						{#each programs as program (program.slug)}
							<li>
								<a
									href={`/${program.slug}`}
									class="group inline-flex items-center gap-2 text-[12px] text-paper/75 transition-colors hover:text-paper"
								>
									<span class="size-1.5" style:background={program.accent} aria-hidden="true"></span>
									{program.code}
									<span class="text-paper/35">— {program.level}</span>
								</a>
							</li>
						{/each}
					</ul>
				</div>

				<div>
					<p class="font-mono text-[9px] text-paper/40">Campus</p>
					<ul class="mt-4 space-y-3">
						{#each homeNav as item (item.href)}
							<li>
								<a href={item.href} class="text-[12px] text-paper/75 transition-colors hover:text-paper">
									{item.label}
								</a>
							</li>
						{/each}
						<li>
							<a
								href={site.website}
								target="_blank"
								rel="noopener noreferrer"
								class="inline-flex items-center gap-1 text-[12px] text-paper/75 transition-colors hover:text-paper"
							>
								CTU Moalboal website
								<ArrowUpRight class="size-3" />
							</a>
						</li>
					</ul>
				</div>

				<div>
					<p class="font-mono text-[9px] text-paper/40">Contact</p>
					<p class="mt-4 text-[12px] leading-relaxed text-paper/70">
						{site.address}<br />
						<a href={`tel:${site.phone.replace(/[^+\d]/g, '')}`} class="hover:text-paper">{site.phone}</a><br />
						<a href={`mailto:${site.email}`} class="hover:text-paper">{site.email}</a>
					</p>
				</div>
			{/if}
		</div>

		<div class="flex flex-col gap-3 pt-6 text-[10px] text-paper/40 sm:flex-row sm:items-center sm:justify-between">
			<p>© {site.surveyYear} {site.campus}. All rights reserved.</p>
			<p class="max-w-2xl sm:text-right">{site.driveNote}</p>
		</div>
	</div>
</footer>
