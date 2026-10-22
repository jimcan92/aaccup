<script lang="ts">
	import { page } from '$app/state';
	import ProgramHeader from '$lib/components/program/program-header.svelte';
	import ProgramHero from '$lib/components/program/program-hero.svelte';
	import SectionNav from '$lib/components/program/section-nav.svelte';
	import SiteFooter from '$lib/components/site/site-footer.svelte';
	import { themeStyle } from '$lib/theme';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const style = $derived(themeStyle(data.program.theme));
	const isHome = $derived(page.route.id === '/[program]' || page.route.id === '/[program]/[visit=visit]');
</script>

<div class="program-scope flex min-h-dvh flex-col" {style}>
	<ProgramHeader program={data.program} visit={data.visit} base={data.base} {style} />
	<ProgramHero program={data.program} visit={data.visit} compact={!isHome} />

	<div class="flex-1 bg-salt">
		<div class="mx-auto grid max-w-[1280px] gap-8 px-5 pb-16 pt-6 sm:px-8 lg:grid-cols-[16.5rem_minmax(0,1fr)] lg:gap-12 lg:pt-10">
			<aside class="hidden lg:block" aria-label={`${data.program.code} sections`}>
				<div class="sticky top-[5.25rem] max-h-[calc(100dvh-6.5rem)] overflow-y-auto pb-6 pr-1">
					<SectionNav program={data.program} visit={data.visit} base={data.base} />
				</div>
			</aside>

			<main id="main" class="min-w-0">
				{@render children()}
			</main>
		</div>
	</div>

	<SiteFooter themed contactNote={data.contactNote}>
		<p class="font-display text-[18px] font-semibold tracking-[-0.02em]">
			{data.program.code} · {data.visit.year} {data.visit.label}
		</p>
		<p class="text-[13px] opacity-80">{data.program.name}</p>
		<p class="pt-1">
			<a href="/" class="text-[13px] underline decoration-current/40 underline-offset-4 hover:decoration-current">
				All AACCUP programs
			</a>
		</p>
	</SiteFooter>
</div>
