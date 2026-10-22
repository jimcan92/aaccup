<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import BrandMarks from '$lib/components/site/brand-marks.svelte';
	import Logo from '$lib/components/site/logo.svelte';
	import ManageLink from '$lib/components/site/manage-link.svelte';
	import SiteFooter from '$lib/components/site/site-footer.svelte';
	import { site } from '$lib/data/site';
	import { portalUrl } from '$lib/portal';
	import { themeStyle } from '$lib/theme';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const content = $derived(data.content);

	function percent(linked: number, total: number): number {
		return total === 0 ? 0 : Math.round((linked / total) * 100);
	}
</script>

<svelte:head>
	<title>{content.title}</title>
	<meta name="description" content={content.description} />
	<meta property="og:title" content={content.title} />
	<meta property="og:description" content={content.description} />
	<meta property="og:type" content="website" />
</svelte:head>

{#if data.preview}
	<div class="fixed bottom-4 left-4 z-50 border border-paper/20 bg-ink px-3 py-2 font-mono text-[11px] text-paper shadow-lg">
		Draft preview · not public
	</div>
{/if}

<header class="border-b border-rule bg-salt">
	<div class="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-5 sm:px-8">
		<Logo compact />
		<div class="flex items-center gap-2 sm:gap-4">
			<a
				href={portalUrl()}
				class="inline-flex min-h-10 items-center gap-2 text-[13px] font-medium text-ink-soft transition-colors hover:text-ink"
			>
				<ArrowLeft class="size-4 shrink-0" />
				<span>Back to <span class="hidden sm:inline">CTU Moalboal</span> portal</span>
			</a>
			<ManageLink class="h-10 bg-ink text-paper hover:bg-ink-soft sm:px-4" />
		</div>
	</div>
</header>

<main id="main" class="flex-1 bg-salt">
	<div class="mx-auto max-w-[1280px] px-5 pb-20 pt-12 sm:px-8 lg:pt-20">
		<div class="flex flex-col gap-3 border-b border-ink/15 pb-6 sm:flex-row sm:items-end sm:justify-between">
			<div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
				<BrandMarks size={72} decorative={false} />
				<h1 class="font-display text-[clamp(2.4rem,7vw,4.75rem)] font-semibold leading-[0.9] tracking-[-0.055em] text-ink">
				AACCUP Accreditation
			</h1>
			</div>
			<p class="font-mono text-[11px] text-ink-soft sm:pb-2">
				{site.campus.replace('Cebu Technological University — ', 'CTU · ')} · {data.programs.length}
				{data.programs.length === 1 ? 'program' : 'programs'}
			</p>
		</div>

		<ul class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Programs">
			{#each data.programs as program (program.slug)}
				{@const pct = percent(program.linked, program.total)}
				<li style={themeStyle(program.theme)} class="program-scope">
					<a
						href={`/${program.slug}`}
						class="group flex h-full flex-col border border-rule bg-paper transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_14px_30px_-18px_rgb(8_42_44/0.45)]"
					>
						<div class="on-program relative overflow-hidden bg-program px-5 pb-5 pt-4 text-program-contrast">
							<div class="flex items-center justify-between gap-3 font-mono text-[11px] opacity-85">
								<span>{program.visit.year} · {program.visit.label}</span>
								<span aria-hidden="true">{pct}%</span>
							</div>
							<p class="mt-8 font-display text-[clamp(3.5rem,9vw,4.75rem)] font-semibold leading-[0.8] tracking-[-0.07em]">
								{program.code}
							</p>
							<!-- Folder edge: a thin rule offset from the bottom, like a tab divider. -->
							<span class="absolute inset-x-0 bottom-0 h-1.5 bg-program-ink/60" aria-hidden="true"></span>
						</div>

						<div class="flex flex-1 flex-col px-5 pb-5 pt-4">
							<p class="text-balance font-display text-[18px] font-semibold leading-snug tracking-[-0.02em] text-ink">
								{program.name}
							</p>

							<div class="mt-auto pt-6">
								<div class="flex items-baseline justify-between gap-3 text-[12px] text-ink-soft">
									<span>
										<span class="font-mono font-medium text-program-ink">{program.linked}</span>
										/ {program.total} documents linked
									</span>
								</div>
								<div
									class="mt-2 h-1.5 bg-program-soft"
									role="progressbar"
									aria-label={`${program.code} documents linked`}
									aria-valuemin={0}
									aria-valuemax={program.total}
									aria-valuenow={program.linked}
								>
									<div class="h-full bg-program" style:width={`${pct}%`}></div>
								</div>
								<span class="mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-program-ink">
									Open the {program.code} dossier
									<ArrowRight class="size-4 transition-transform group-hover:translate-x-0.5" />
								</span>
							</div>
						</div>
					</a>
				</li>
			{/each}
		</ul>
	</div>
</main>

<SiteFooter contactNote={content.contactNote} />
