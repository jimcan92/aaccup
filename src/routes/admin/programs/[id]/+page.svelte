<script lang="ts">
	import { enhance } from '#lib/admin-enhance.js';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import PencilLine from '@lucide/svelte/icons/pencil-line';
	import PageHeader from '#lib/components/admin/page-header.svelte';
	import StatusBadge from '#lib/components/admin/status-badge.svelte';
	import DriveSetup from '#lib/components/admin/drive-setup.svelte';
	import ImageField from '#lib/components/admin/blocks/image-field.svelte';
	import PreviewDialog from '#lib/components/admin/preview-dialog.svelte';
	import PreviewPane from '#lib/components/admin/preview-pane.svelte';
	import { readMessage, type PreviewMessage, type ProgramPatch } from '#lib/block-preview.js';
	import { PreviewToggle } from '#lib/preview-toggle.svelte.js';
	import { contrastRatio } from '#lib/theme.js';
	import { fresh } from '#lib/fresh-link.js';
	import type { Snippet } from 'svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// The logo field uploads on its own; the form posts the resulting link.
	// svelte-ignore state_referenced_locally
	let logo = $state<string>(data.program.logo_url ?? '');
	// svelte-ignore state_referenced_locally
	let cover = $state<string>(data.program.cover_url ?? '');

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

	// The program page preview: its frame shows the saved page, then the fields below as they are typed.
	const preview = new PreviewToggle();
	const previewSrc = $derived(`/admin/programs/${data.program.id}/landing/preview`);
	let sideFrame = $state<HTMLIFrameElement>();
	let dialogFrame = $state<HTMLIFrameElement>();

	// The text fields as typed; the logo, cover and colors are state already.
	// svelte-ignore state_referenced_locally
	let typed = $state({
		code: data.program.code,
		name: data.program.name,
		degree: data.program.degree ?? '',
		summary: data.program.summary ?? '',
		tagline: data.program.tagline ?? '',
		website: data.program.website_url ?? '',
		email: data.program.email ?? '',
		phone: data.program.phone ?? ''
	});

	function read(event: Event) {
		const values = new FormData(event.currentTarget as HTMLFormElement);
		const text = (name: string) => String(values.get(name) ?? '');
		typed = {
			code: text('code'),
			name: text('name'),
			degree: text('degree'),
			summary: text('summary'),
			tagline: text('tagline'),
			website: text('website_url'),
			email: text('email'),
			phone: text('phone')
		};
	}

	// Empty optional fields are hidden on the public page, as the dossier loader does.
	const patch = $derived<ProgramPatch>({
		code: typed.code,
		name: typed.name,
		degree: typed.degree,
		summary: typed.summary,
		tagline: typed.tagline || undefined,
		logo: logo || undefined,
		cover: cover || undefined,
		website: typed.website || undefined,
		email: typed.email || undefined,
		phone: typed.phone || undefined,
		theme: { ...colors }
	});

	function post(frame?: HTMLIFrameElement) {
		const message: PreviewMessage = { type: 'aaccup:program', program: $state.snapshot(patch) };
		for (const target of frame ? [frame] : [sideFrame, dialogFrame]) {
			target?.contentWindow?.postMessage(message, location.origin);
		}
	}

	// Send edits to the preview a moment after typing stops.
	$effect(() => {
		void patch;
		const timer = setTimeout(() => post(), 150);
		return () => clearTimeout(timer);
	});

	// A frame that has (re)loaded asks for the details.
	function onMessage(event: MessageEvent) {
		if (readMessage(event)?.type !== 'aaccup:ready') return;
		post([sideFrame, dialogFrame].find((item) => item?.contentWindow === event.source));
	}

	const field = 'h-11 w-full border border-rule bg-salt px-3 text-[14px] text-ink outline-none focus:border-ink disabled:opacity-60';
	const colorFields = [
		{ key: 'program', label: 'Program color', hint: 'Header, buttons, numbers' },
		{ key: 'ink', label: 'Dark ink', hint: 'Text on light surfaces' },
		{ key: 'soft', label: 'Tint', hint: 'Hero and hover surfaces' },
		{ key: 'contrast', label: 'Text on program color', hint: 'Usually white' }
	] as const;
</script>

<svelte:window onmessage={onMessage} />

<svelte:head>
	<title>{data.program.code} · Programs · AACCUP Desk</title>
</svelte:head>

{#snippet card(title: string, hint: string, body: Snippet)}
	<section class="border border-rule bg-paper">
		<header class="border-b border-rule px-5 py-3.5">
			<h2 class="font-display text-[17px] font-semibold tracking-[-0.02em]">{title}</h2>
			<p class="mt-0.5 text-[12px] text-ink-soft">{hint}</p>
		</header>
		<div class="p-5">{@render body()}</div>
	</section>
{/snippet}

<a href="/admin/programs" class="inline-flex min-h-9 items-center gap-2 text-[13px] text-ink-soft hover:text-ink">
	<ArrowLeft class="size-4" />
	All programs
</a>

<div class="mt-4">
	<PageHeader eyebrow={`Program · /${data.program.slug}`} title={`${data.program.code} — ${data.program.name}`} />
</div>

<div class={preview.side ? 'grid grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-8' : ''}>
<div class="min-w-0">
<!-- Stays in view while scrolling, so the preview and Save are always one click away. -->
<div class="sticky top-16 z-10 -mx-5 flex flex-wrap items-center gap-2 border-b border-rule bg-salt/95 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:top-0 {preview.side ? 'xl:mx-0 xl:px-0' : ''}">
	<p class="mr-auto text-[13px] text-ink-soft">
		<span class="font-medium text-ink">{data.program.code}</span> · {data.program.status === 'published' ? 'Published' : 'Draft'}
	</p>
	<button type="button" onclick={() => preview.toggle()} class="inline-flex h-10 cursor-pointer items-center gap-2 border px-4 text-[13px] font-medium {preview.side ? 'border-ink bg-paper' : 'border-rule bg-paper hover:border-ink/30'}" aria-pressed={preview.wide ? preview.side : undefined}>
		{#if preview.side}<EyeOff class="size-4" /> Hide preview{:else}<Eye class="size-4" /> Preview{/if}
	</button>
	<a href={`/admin/programs/${data.program.id}/landing`} class="inline-flex h-10 items-center gap-2 border border-rule bg-paper px-4 text-[13px] font-medium hover:border-ink/30">
		<PencilLine class="size-4" /> Edit program page
	</a>
	<a href={`/${data.program.slug}`} use:fresh target="_blank" rel="noopener noreferrer" class="inline-flex h-10 items-center gap-2 border border-rule bg-paper px-4 text-[13px] font-medium hover:border-ink/30">
		Public page <ArrowUpRight class="size-4" />
	</a>
	{#if data.canManage}
		<button form="program-details" class="inline-flex h-10 cursor-pointer items-center gap-2 bg-ink px-4 text-[13px] font-medium text-paper hover:bg-ink-soft">Save details</button>
	{/if}
</div>

<form id="program-details" method="POST" action="?/update" oninput={read} use:enhance={() => async ({ update }) => update({ reset: false })} class="mt-6">
	<fieldset disabled={!data.canManage} class="min-w-0 space-y-5">
		{#snippet basics()}
			<div class="grid gap-4 sm:grid-cols-[9rem_1fr]">
				<label class="grid gap-1.5 text-[13px] font-medium">Code<input name="code" required value={data.program.code} class={field} /></label>
				<label class="grid gap-1.5 text-[13px] font-medium">Name<input name="name" required value={data.program.name} class={field} /></label>
				<label class="grid gap-1.5 text-[13px] font-medium">URL slug<input name="slug" required value={data.program.slug} class="{field} font-mono text-[13px]" /></label>
				<label class="grid gap-1.5 text-[13px] font-medium">Degree<input name="degree" value={data.program.degree ?? ''} class={field} /></label>
				<label class="grid gap-1.5 text-[13px] font-medium">
					Sort order<input name="sort_order" type="number" value={data.program.sort_order} class={field} />
				</label>
				<label class="grid gap-1.5 text-[13px] font-medium">
					Visibility
					<select name="status" class={field}>
						<option value="published" selected={data.program.status === 'published'}>Published — on the public site</option>
						<option value="draft" selected={data.program.status !== 'published'}>Draft — hidden</option>
					</select>
				</label>
			</div>
		{/snippet}
		{@render card('Basics', 'The program’s name and address on the site, and whether it shows.', basics)}

		{#snippet words()}
			<div class="grid gap-4">
				<label class="grid gap-1.5 text-[13px] font-medium">
					Tagline
					<input name="tagline" value={data.program.tagline ?? ''} maxlength="160" placeholder="One short line, e.g. Stewards of Cebu’s coastal waters" class={field} />
				</label>
				<label class="grid gap-1.5 text-[13px] font-medium">
					Summary for evaluators
					<textarea name="summary" rows="4" class="w-full border border-rule bg-salt p-3 text-[14px] font-normal leading-relaxed outline-none focus:border-ink">{data.program.summary ?? ''}</textarea>
				</label>
			</div>
		{/snippet}
		{@render card('Tagline and summary', 'Under the program title on the home page card and the program page. Empty fields are hidden.', words)}

		{#snippet images()}
			<div class="grid gap-5">
				<div class="grid gap-1.5">
					<span class="text-[13px] font-medium">Logo</span>
					<ImageField bind:value={logo} programId={data.program.id} label="Logo" contain />
					<input type="hidden" name="logo_url" value={logo} />
					<span class="text-[12px] text-ink-soft">A square image with a transparent or plain background looks best.</span>
				</div>
				<div class="grid gap-1.5">
					<span class="text-[13px] font-medium">Cover image</span>
					<ImageField bind:value={cover} programId={data.program.id} label="Cover" />
					<input type="hidden" name="cover_url" value={cover} />
					<span class="text-[12px] text-ink-soft">The photo behind the program’s card on the home page. Empty: the first photo of the program page’s gallery is used.</span>
				</div>
			</div>
		{/snippet}
		{@render card('Logo and cover', 'Both optional.', images)}

		{#snippet contact()}
			<div class="grid gap-4 sm:grid-cols-2">
				<label class="grid gap-1.5 text-[13px] font-medium sm:col-span-2">Website<input name="website_url" type="url" value={data.program.website_url ?? ''} placeholder="https://…" class="{field} font-mono text-[13px]" /></label>
				<label class="grid gap-1.5 text-[13px] font-medium">Email<input name="email" type="email" value={data.program.email ?? ''} placeholder="bsfi.moalboal@ctu.edu.ph" class={field} /></label>
				<label class="grid gap-1.5 text-[13px] font-medium">Contact number<input name="phone" type="tel" value={data.program.phone ?? ''} placeholder="0917 123 4567" class={field} /></label>
			</div>
		{/snippet}
		{@render card('Contact', 'Shown on the program page. All optional; empty fields are hidden.', contact)}

		{#snippet theme()}
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
			<ul class="mt-5 space-y-1.5 border-t border-rule pt-4 text-[13px]">
				{#each checks as check (check.label)}
					{@const pass = check.ratio >= 4.5}
					<li class="flex items-center justify-between">
						<span>{check.label}</span>
						<span class="font-mono text-[12px] {pass ? 'text-bsfi' : 'text-destructive'}">{check.ratio.toFixed(1)}:1 {pass ? 'AA' : 'too low'}</span>
					</li>
				{/each}
			</ul>
			<p class="mt-3 text-[12px] text-ink-soft">Text needs at least 4.5:1. If the text color fails on the program color, the site switches to white or ink automatically.</p>
		{/snippet}
		{@render card('Colors', 'The program page’s header, buttons and surfaces.', theme)}
	</fieldset>
</form>

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
</div>

{#if preview.side}
	<PreviewPane src={previewSrc} hint="Preview · the program page, with your unsaved changes" bind:frame={sideFrame} />
{/if}
</div>

<PreviewDialog src={previewSrc} hint="The program page, with your unsaved changes." bind:open={preview.dialogOpen} bind:frame={dialogFrame} />
