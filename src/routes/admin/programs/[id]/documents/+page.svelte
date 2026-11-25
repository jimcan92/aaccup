<script lang="ts">
	import { enhance } from '#lib/admin-enhance.js';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import DriveSetup from '#lib/components/admin/drive-setup.svelte';
	import PublicPreview from '#lib/components/admin/public-preview.svelte';
	import StatusBadge from '#lib/components/admin/status-badge.svelte';
	import { visitHref } from '#lib/admin-links.js';
	import { mandatoryAreas, VISIT_AREAS, type VisitType } from '#lib/visit-presets.js';
	import type { PageProps } from './$types';

	// The Documents tab: Drive setup and visits, beside the public documents page.
	let { data }: PageProps = $props();

	const field = 'h-11 w-full border border-rule bg-salt px-3 text-[14px] text-ink outline-none focus:border-ink disabled:opacity-60';

	// New visit: the type and level tick a starting set of areas; the user may change any tick.
	let level = $state('');
	let visitType = $state<VisitType>('first');
	let picked = $state<string[]>([]);
	function preset() {
		picked = visitType === 'first' ? mandatoryAreas(level) : [];
	}
</script>

<svelte:head>
	<title>{data.program.code} documents · AACCUP Desk</title>
</svelte:head>

<PublicPreview
	src={`/${data.program.slug}/dossier`}
	hint="the public documents page, as published"
	actions={[{ id: 'public', label: 'View documents page', icon: ArrowUpRight, href: `/${data.program.slug}/dossier`, external: true }]}
>
{#snippet children()}

{#if data.drive?.visit}
	<div>
		<DriveSetup setup={data.drive} canManage={data.canManage} />
	</div>
{/if}

<section class="mt-10">
	<div class="flex items-end justify-between border-b border-ink/20 pb-2">
		<h2 class="font-display text-[22px] font-semibold tracking-[-0.03em]">Visits</h2>
		<span class="font-mono text-[12px] text-ink-soft">{data.visits.length}</span>
	</div>
	<ul>
		{#each data.visits as visit (visit.id)}
			<li>
				<a href={visitHref(data.program.id, visit.id)} class="group grid gap-2 border-b border-rule px-1 py-4 hover:bg-paper sm:grid-cols-[1fr_auto_auto_auto] sm:items-center sm:gap-6 sm:px-3">
					<span>
						<span class="block text-[15px] font-medium">{visit.year} · {visit.label}</span>
						<span class="font-mono text-[12px] text-ink-soft">/{data.program.slug}{visit.status === 'active' ? '' : `/${visit.slug}`}</span>
					</span>
					<span class="text-[13px] text-ink-soft">{visit.sections} sections · {visit.linked}/{visit.total} linked</span>
					<span class="flex gap-2">
						{#if visit.status === 'active'}<span class="border border-ink/30 px-2 py-0.5 text-[12px] font-medium">Active</span>{/if}
						<StatusBadge status={visit.workflow} />
					</span>
					<ArrowRight class="hidden size-4 sm:block" />
				</a>
			</li>
		{:else}
			<li class="py-6 text-[14px] text-ink-soft">No visits yet.</li>
		{/each}
	</ul>

	{#if data.canManage}
		<form method="POST" action="?/createVisit" use:enhance class="mt-6 grid gap-4 border border-rule bg-paper p-5 md:grid-cols-[7rem_9rem_1fr_1fr_auto] md:items-end">
			<p class="font-display text-[18px] font-semibold md:col-span-5">Add a visit</p>
			<label class="grid gap-1.5 text-[13px] font-medium">Year<input name="year" type="number" required min="1980" max="2100" class={field} /></label>
			<label class="grid gap-1.5 text-[13px] font-medium">Level<input name="level" required placeholder="Level IV" bind:value={level} oninput={preset} class={field} /></label>
			<label class="grid gap-1.5 text-[13px] font-medium">Public label<input name="label" placeholder="Level IV visit" class={field} /></label>
			<label class="grid gap-1.5 text-[13px] font-medium">Previous survey label<input name="previous_label" placeholder="2026 survey" class={field} /></label>
			<button class="h-11 bg-ink px-5 text-[14px] font-medium text-paper hover:bg-ink-soft">Add</button>
			<fieldset class="grid gap-3 border-t border-rule pt-4 md:col-span-5">
				<legend class="sr-only">Starting areas</legend>
				<div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
					<span class="font-medium">Type of visit</span>
					<label class="inline-flex items-center gap-2"><input type="radio" name="visit_type" value="first" bind:group={visitType} onchange={preset} /> First survey at this level</label>
					<label class="inline-flex items-center gap-2"><input type="radio" name="visit_type" value="revisit" bind:group={visitType} onchange={preset} /> Revisit (only the areas in the Board Action)</label>
				</div>
				<div class="flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
					<span class="font-medium">Current-visit areas</span>
					{#each VISIT_AREAS as area (area.slug)}
						<label class="inline-flex items-center gap-2"><input type="checkbox" name="areas" value={area.slug} bind:group={picked} /> {area.title}</label>
					{/each}
					<label class="inline-flex items-center gap-2"><input type="checkbox" name="additional" checked /> Additional documents (requested)</label>
				</div>
				<p class="text-[12px] text-ink-soft">
					{#if visitType === 'first'}
						A first survey covers the level's mandatory areas{mandatoryAreas(level).length ? ' (ticked for you)' : ''} plus the options the program chose.
					{:else}
						A revisit covers only the areas the Board Action names; tick those.
					{/if}
					These are only a start: sections can be added, renamed or removed on the visit's page.
				</p>
			</fieldset>
			<p class="text-[12px] text-ink-soft md:col-span-5">
				New visits start archived and in draft, with a common-documents section and the areas ticked above. Say “visit”, not “accredited”, unless the status is official.
			</p>
		</form>
	{/if}
</section>
{/snippet}
</PublicPreview>
