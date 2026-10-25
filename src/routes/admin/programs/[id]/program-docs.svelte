<script lang="ts">
	import { enhance } from '#lib/admin-enhance.js';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import DriveSetup from '#lib/components/admin/drive-setup.svelte';
	import PreviewDialog from '#lib/components/admin/preview-dialog.svelte';
	import PreviewPane from '#lib/components/admin/preview-pane.svelte';
	import StatusBadge from '#lib/components/admin/status-badge.svelte';
	import { fresh } from '#lib/fresh-link.js';
	import { PreviewToggle } from '#lib/preview-toggle.svelte.js';
	import type { PageData } from './$types';

	// The Documents tab: Drive setup and visits, beside the public documents page.
	let { data, field }: { data: PageData; field: string } = $props();

	const preview = new PreviewToggle();
	// The public page is cached at the edge; a fresh mark shows the latest. Only rendered in the browser.
	const previewSrc = $derived(`/${data.program.slug}/dossier?fresh=${Date.now()}`);
</script>

<div class={preview.side ? 'grid grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-8' : ''}>
<div class="min-w-0">
<div class="sticky top-16 z-10 -mx-5 flex flex-wrap items-center gap-2 border-b border-rule bg-salt/95 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:top-0 {preview.side ? 'xl:mx-0 xl:px-0' : ''}">
	<p class="mr-auto text-[13px] text-ink-soft">
		<span class="font-medium text-ink">{data.program.code} documents</span> · {data.visits.length}
		{data.visits.length === 1 ? 'visit' : 'visits'}
	</p>
	<button type="button" onclick={() => preview.toggle()} class="inline-flex h-10 cursor-pointer items-center gap-2 border px-4 text-[13px] font-medium {preview.side ? 'border-ink bg-paper' : 'border-rule bg-paper hover:border-ink/30'}" aria-pressed={preview.wide ? preview.side : undefined}>
		{#if preview.side}<EyeOff class="size-4" /> Hide preview{:else}<Eye class="size-4" /> Preview{/if}
	</button>
	<a href={`/${data.program.slug}/dossier`} use:fresh target="_blank" rel="noopener noreferrer" class="inline-flex h-10 items-center gap-2 border border-rule bg-paper px-4 text-[13px] font-medium hover:border-ink/30">
		View documents page <ArrowUpRight class="size-4" />
	</a>
</div>

{#if data.drive?.visit}
	<div class="mt-6">
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
				<a href={`/admin/visits/${visit.id}`} class="group grid gap-2 border-b border-rule px-1 py-4 hover:bg-paper sm:grid-cols-[1fr_auto_auto_auto] sm:items-center sm:gap-6 sm:px-3">
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
			<label class="grid gap-1.5 text-[13px] font-medium">Level<input name="level" required placeholder="Level IV" class={field} /></label>
			<label class="grid gap-1.5 text-[13px] font-medium">Public label<input name="label" placeholder="Level IV visit" class={field} /></label>
			<label class="grid gap-1.5 text-[13px] font-medium">Previous survey label<input name="previous_label" placeholder="2026 survey" class={field} /></label>
			<button class="h-11 bg-ink px-5 text-[14px] font-medium text-paper hover:bg-ink-soft">Add</button>
			<p class="text-[12px] text-ink-soft md:col-span-5">
				New visits start archived and in draft, with an empty common-documents section. Say “visit”, not “accredited”, unless the status is official.
			</p>
		</form>
	{/if}
</section>
</div>

{#if preview.side}
	<PreviewPane src={previewSrc} hint="Preview · the public documents page, as published" />
{/if}
</div>

<PreviewDialog src={previewSrc} hint="The public documents page, as published." bind:open={preview.dialogOpen} />
