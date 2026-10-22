<script lang="ts">
	import { enhance } from '$app/forms';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import PageHeader from '$lib/components/admin/page-header.svelte';
	import StatusBadge from '$lib/components/admin/status-badge.svelte';
	import DriveSetup from '$lib/components/admin/drive-setup.svelte';
	import FormMessage from '$lib/components/admin/form-message.svelte';
	import { contrastRatio } from '$lib/theme';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// Kept in a variable: inside a Svelte attribute, `{6}` would be read as an expression.
	const HEX_PATTERN = '#[0-9a-fA-F]{6}';

	// svelte-ignore state_referenced_locally
	let colors = $state({
		program: data.program.theme_program ?? '#335052',
		ink: data.program.theme_ink ?? '#082a2c',
		soft: data.program.theme_soft ?? '#e3e9e1',
		contrast: data.program.theme_contrast ?? '#ffffff'
	});

	const checks = $derived([
		{ label: 'Text on program color', ratio: contrastRatio(colors.contrast, colors.program) },
		{ label: 'Program color on tint', ratio: contrastRatio(colors.program, colors.soft) },
		{ label: 'Ink on tint', ratio: contrastRatio(colors.ink, colors.soft) }
	]);

	const field = 'h-11 w-full border border-rule bg-salt px-3 text-[14px] text-ink outline-none focus:border-ink disabled:opacity-60';
	const colorFields = [
		{ key: 'program', label: 'Program color', hint: 'Header, buttons, numbers' },
		{ key: 'ink', label: 'Dark ink', hint: 'Text on light surfaces' },
		{ key: 'soft', label: 'Tint', hint: 'Hero and hover surfaces' },
		{ key: 'contrast', label: 'Text on program color', hint: 'Usually white' }
	] as const;
</script>

<svelte:head>
	<title>{data.program.code} · Programs · AACCUP Desk</title>
</svelte:head>

<a href="/admin/programs" class="inline-flex min-h-9 items-center gap-2 text-[13px] text-ink-soft hover:text-ink">
	<ArrowLeft class="size-4" />
	All programs
</a>

<div class="mt-4">
	<PageHeader eyebrow={`Program · /${data.program.slug}`} title={`${data.program.code} — ${data.program.name}`}>
		{#snippet actions()}
			<a href={`/${data.program.slug}`} target="_blank" rel="noopener noreferrer" class="inline-flex h-10 items-center gap-2 border border-rule bg-paper px-4 text-[13px] font-medium hover:border-ink/30">
				Public page
				<ArrowUpRight class="size-4" />
			</a>
		{/snippet}
	</PageHeader>
</div>

<FormMessage {form} />

<div class="mt-8 grid gap-10 xl:grid-cols-[1.2fr_1fr]">
	<form method="POST" action="?/update" use:enhance={() => async ({ update }) => update({ reset: false })} class="space-y-6">
		<fieldset disabled={!data.canManage} class="grid gap-4 sm:grid-cols-[8rem_1fr]">
			<legend class="mb-3 font-display text-[20px] font-semibold tracking-[-0.03em]">Details</legend>
			<label class="grid gap-1.5 text-[13px] font-medium">Code<input name="code" required value={data.program.code} class={field} /></label>
			<label class="grid gap-1.5 text-[13px] font-medium">Name<input name="name" required value={data.program.name} class={field} /></label>
			<label class="grid gap-1.5 text-[13px] font-medium">URL slug<input name="slug" required value={data.program.slug} class={field} /></label>
			<label class="grid gap-1.5 text-[13px] font-medium">Degree<input name="degree" value={data.program.degree ?? ''} class={field} /></label>
			<label class="grid gap-1.5 text-[13px] font-medium sm:col-span-2">
				Summary for evaluators
				<textarea name="summary" rows="4" class="w-full border border-rule bg-salt p-3 text-[14px] leading-relaxed outline-none focus:border-ink">{data.program.summary ?? ''}</textarea>
			</label>
			<label class="grid gap-1.5 text-[13px] font-medium">Sort order<input name="sort_order" type="number" value={data.program.sort_order} class={field} /></label>
			<label class="grid gap-1.5 text-[13px] font-medium">
				Visibility
				<select name="status" class={field}>
					<option value="published" selected={data.program.status === 'published'}>Published — on the public site</option>
					<option value="draft" selected={data.program.status !== 'published'}>Draft — hidden</option>
				</select>
			</label>
		</fieldset>

		<fieldset disabled={!data.canManage}>
			<legend class="mb-3 font-display text-[20px] font-semibold tracking-[-0.03em]">Theme</legend>
			<div class="grid gap-4 sm:grid-cols-2">
				{#each colorFields as item (item.key)}
					<label class="grid gap-1.5 text-[13px] font-medium">
						{item.label}
						<span class="flex gap-2">
							<input type="color" bind:value={colors[item.key]} class="h-11 w-14 shrink-0 cursor-pointer border border-rule bg-salt p-1" aria-label={`${item.label} picker`} />
							<input name={`theme_${item.key}`} bind:value={colors[item.key]} pattern={HEX_PATTERN} required class="{field} font-mono" />
						</span>
						<span class="text-[12px] font-normal text-ink-soft">{item.hint}</span>
					</label>
				{/each}
			</div>
		</fieldset>

		{#if data.canManage}
			<button class="h-11 bg-ink px-6 text-[14px] font-medium text-paper hover:bg-ink-soft">Save program</button>
		{/if}
	</form>

	<aside class="space-y-4">
		<p class="font-mono text-[12px] text-ink-soft">Preview</p>
		<div class="border border-rule" style:background={colors.soft}>
			<div class="flex items-center justify-between px-4 py-3" style:background={colors.program} style:color={colors.contrast}>
				<span class="font-display text-[18px] font-semibold">{data.program.code}</span>
				<span class="text-[12px]">CTU Moalboal portal ↗</span>
			</div>
			<div class="p-4">
				<p class="font-display text-[44px] font-semibold leading-none tracking-[-0.06em]" style:color={colors.program}>{data.program.code}</p>
				<p class="mt-2 text-[14px] font-medium" style:color={colors.ink}>{data.program.name}</p>
				<span class="mt-3 inline-block px-3 py-1.5 text-[12px] font-medium" style:background={colors.program} style:color={colors.contrast}>Open in Drive</span>
			</div>
		</div>
		<ul class="space-y-1.5 text-[13px]">
			{#each checks as check (check.label)}
				{@const pass = check.ratio >= 4.5}
				<li class="flex items-center justify-between border-b border-rule pb-1.5">
					<span>{check.label}</span>
					<span class="font-mono text-[12px] {pass ? 'text-bsfi' : 'text-destructive'}">{check.ratio.toFixed(1)}:1 {pass ? 'AA' : 'too low'}</span>
				</li>
			{/each}
		</ul>
		<p class="text-[12px] text-ink-soft">Text needs at least 4.5:1. If the text color fails on the program color, the site switches to white or ink automatically.</p>
	</aside>
</div>

{#if data.drive?.visit}
	<div class="mt-14">
		<DriveSetup setup={data.drive} canManage={data.canManage} />
	</div>
{/if}

<section class="mt-14">
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
