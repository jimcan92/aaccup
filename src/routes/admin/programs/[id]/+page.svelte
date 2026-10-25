<script lang="ts">
	import { enhance } from '#lib/admin-enhance.js';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ImageField from '#lib/components/admin/blocks/image-field.svelte';
	import LandingPageEditor from '#lib/components/admin/landing-page-editor.svelte';
	import type { ProgramPatch } from '#lib/block-preview.js';
	import { contrastRatio } from '#lib/theme.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let detailsOpen = $state(true);

	// Kept as state, so unsaved edits survive switching tabs and reach the preview as they are typed.
	// svelte-ignore state_referenced_locally
	let typed = $state({
		code: data.program.code,
		name: data.program.name,
		degree: data.program.degree ?? '',
		summary: data.program.summary ?? '',
		tagline: data.program.tagline ?? '',
		logo: data.program.logo_url ?? '',
		cover: data.program.cover_url ?? '',
		website: data.program.website_url ?? '',
		email: data.program.email ?? '',
		phone: data.program.phone ?? ''
	});

	// Kept in a variable: inside a Svelte attribute, `{6}` would be read as an expression.
	const HEX_PATTERN = '#[0-9a-fA-F]{6}';

	// svelte-ignore state_referenced_locally
	let colors = $state({
		program: data.program.theme_program ?? '#335052',
		ink: data.program.theme_ink ?? '#082a2c',
		soft: data.program.theme_soft ?? '#e3e9e1',
		contrast: data.program.theme_contrast ?? '#ffffff'
	});

	// Empty optional fields are hidden on the public page, as the dossier loader does.
	const patch = $derived<ProgramPatch>({
		code: typed.code,
		name: typed.name,
		degree: typed.degree,
		summary: typed.summary,
		tagline: typed.tagline || undefined,
		logo: typed.logo || undefined,
		cover: typed.cover || undefined,
		website: typed.website || undefined,
		email: typed.email || undefined,
		phone: typed.phone || undefined,
		theme: { ...colors }
	});

	const checks = $derived([
		{ label: 'Text on program color', ratio: contrastRatio(colors.contrast, colors.program) },
		{ label: 'Program color on tint', ratio: contrastRatio(colors.program, colors.soft) },
		{ label: 'Ink on tint', ratio: contrastRatio(colors.ink, colors.soft) }
	]);

	const field = 'h-11 w-full border border-rule bg-salt px-3 text-[14px] text-ink outline-none focus:border-ink disabled:opacity-60';
	const label = 'grid gap-1.5 text-[13px] font-medium';
	const group = 'border-t border-rule pt-5';
	const groupTitle = 'mb-3 font-display text-[15px] font-semibold tracking-[-0.01em]';
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

	<LandingPageEditor
		label={data.program.code}
		publicHref={`/${data.program.slug}`}
		folderId={data.program.id}
		blocks={data.blocks}
		error={data.error}
		canEdit={data.canEdit}
		canManage={data.canManage}
		empty="No blocks yet. The public page shows the program title, summary, and the link to the documents until you add some."
		previewSrc={`/admin/programs/${data.program.id}/landing/preview`}
		program={patch}
		inBar
	>
		{#snippet top()}
			<section class="border border-rule bg-paper" aria-labelledby="details-heading">
				<button type="button" onclick={() => (detailsOpen = !detailsOpen)} aria-expanded={detailsOpen} aria-controls="program-details" class="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left {detailsOpen ? 'border-b border-rule' : ''}">
					<span class="mr-auto">
						<span id="details-heading" class="block font-display text-[17px] font-semibold tracking-[-0.02em]">Program details</span>
						<span class="block text-[12px] text-ink-soft">Name, tagline, logo, contact and colors. They show on the home page card and at the top of the program page.</span>
					</span>
					<span class="text-[12px] text-ink-soft">{data.program.status === 'published' ? 'Published' : 'Draft'}</span>
					<ChevronDown class="size-4 shrink-0 transition-transform {detailsOpen ? 'rotate-180' : ''}" />
				</button>

				<form id="program-details" method="POST" action="?/update" use:enhance={() => async ({ update }) => update({ reset: false })} class="p-4" hidden={!detailsOpen}>
					<fieldset disabled={!data.canManage} class="min-w-0 space-y-5">
						<div class="grid gap-4 sm:grid-cols-[9rem_1fr]">
							<label class={label}>Code<input name="code" required bind:value={typed.code} class={field} /></label>
							<label class={label}>Name<input name="name" required bind:value={typed.name} class={field} /></label>
							<label class={label}>URL slug<input name="slug" required value={data.program.slug} class="{field} font-mono text-[13px]" /></label>
							<label class={label}>Degree<input name="degree" bind:value={typed.degree} class={field} /></label>
							<label class={label}>Sort order<input name="sort_order" type="number" value={data.program.sort_order} class={field} /></label>
							<label class={label}>
								Visibility
								<select name="status" class={field}>
									<option value="published" selected={data.program.status === 'published'}>Published — on the public site</option>
									<option value="draft" selected={data.program.status !== 'published'}>Draft — hidden</option>
								</select>
							</label>
						</div>

						<div class="{group} grid gap-4">
							<p class={groupTitle}>Tagline and summary</p>
							<label class={label}>
								Tagline
								<input name="tagline" bind:value={typed.tagline} maxlength="160" placeholder="One short line, e.g. Stewards of Cebu’s coastal waters" class={field} />
							</label>
							<label class={label}>
								Summary for evaluators
								<textarea name="summary" rows="4" bind:value={typed.summary} class="w-full border border-rule bg-salt p-3 text-[14px] font-normal leading-relaxed outline-none focus:border-ink"></textarea>
							</label>
						</div>

						<div class="{group} grid gap-5">
							<p class="{groupTitle} -mb-2">Logo and cover</p>
							<div class="grid gap-1.5">
								<span class="text-[13px] font-medium">Logo</span>
								<ImageField bind:value={typed.logo} programId={data.program.id} label="Logo" contain />
								<input type="hidden" name="logo_url" value={typed.logo} />
								<span class="text-[12px] text-ink-soft">A square image with a transparent or plain background looks best.</span>
							</div>
							<div class="grid gap-1.5">
								<span class="text-[13px] font-medium">Cover image</span>
								<ImageField bind:value={typed.cover} programId={data.program.id} label="Cover" />
								<input type="hidden" name="cover_url" value={typed.cover} />
								<span class="text-[12px] text-ink-soft">The photo behind the program title and the program’s card on the home page. Empty: the first photo of the first gallery or carousel below is used.</span>
							</div>
						</div>

						<div class="{group} grid gap-4 sm:grid-cols-2">
							<p class="{groupTitle} -mb-1 sm:col-span-2">Contact <span class="font-sans text-[12px] font-normal text-ink-soft">· optional; empty fields are hidden</span></p>
							<label class="{label} sm:col-span-2">Website<input name="website_url" type="url" bind:value={typed.website} placeholder="https://…" class="{field} font-mono text-[13px]" /></label>
							<label class={label}>Email<input name="email" type="email" bind:value={typed.email} placeholder="bsfi.moalboal@ctu.edu.ph" class={field} /></label>
							<label class={label}>Contact number<input name="phone" type="tel" bind:value={typed.phone} placeholder="0917 123 4567" class={field} /></label>
						</div>

						<div class={group}>
							<p class={groupTitle}>Colors</p>
							<div class="grid gap-4 sm:grid-cols-2">
								{#each colorFields as item (item.key)}
									<label class={label}>
										{item.label}
										<span class="flex gap-2">
											<input type="color" bind:value={colors[item.key]} class="h-11 w-14 shrink-0 cursor-pointer border border-rule bg-salt p-1" aria-label={`${item.label} picker`} />
											<input name={`theme_${item.key}`} bind:value={colors[item.key]} pattern={HEX_PATTERN} required class="{field} font-mono" />
										</span>
										<span class="text-[12px] font-normal text-ink-soft">{item.hint}</span>
									</label>
								{/each}
							</div>
							<ul class="mt-4 space-y-1.5 text-[13px]">
								{#each checks as check (check.label)}
									{@const pass = check.ratio >= 4.5}
									<li class="flex items-center justify-between">
										<span>{check.label}</span>
										<span class="font-mono text-[12px] {pass ? 'text-bsfi' : 'text-destructive'}">{check.ratio.toFixed(1)}:1 {pass ? 'AA' : 'too low'}</span>
									</li>
								{/each}
							</ul>
							<p class="mt-2 text-[12px] text-ink-soft">Text needs at least 4.5:1. If the text color fails on the program color, the site switches to white or ink automatically.</p>
						</div>
					</fieldset>

					{#if data.canManage}
						<div class="mt-5 flex flex-wrap items-center gap-2 border-t border-rule pt-4">
							<button class="h-10 bg-ink px-4 text-[13px] font-medium text-paper hover:bg-ink-soft">Save details</button>
							<span class="text-[12px] text-ink-soft">Details go live within a minute of saving; the blocks below stay drafts until published.</span>
						</div>
					{:else}
						<p class="mt-4 text-[12px] text-ink-soft">Only admins and focal persons edit the details.</p>
					{/if}
				</form>
			</section>
		{/snippet}
	</LandingPageEditor>
