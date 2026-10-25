<script lang="ts">
	import { enhance } from '#lib/admin-enhance.js';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import Copy from '@lucide/svelte/icons/copy';
	import DriveSetup from '#lib/components/admin/drive-setup.svelte';
	import PageHeader from '#lib/components/admin/page-header.svelte';
	import StatusBadge from '#lib/components/admin/status-badge.svelte';
	import { pad2 } from '#lib/format.js';
	import { sectionHref } from '#lib/admin-links.js';
	import { fresh } from '#lib/fresh-link.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const program = $derived(data.visit.program as { id: string; code: string; slug: string; name: string; theme_program: string | null });
	const publicUrl = $derived(data.visit.status === 'active' ? `/${program.slug}` : `/${program.slug}/${data.visit.slug}`);
	const hasCommon = $derived(data.sections.some((section) => section.kind === 'common'));
	const groups = $derived(
		(['common', 'current', 'previous'] as const).map((kind) => ({
			kind,
			label: kind === 'common' ? 'Common documents' : kind === 'current' ? 'Current visit sections' : 'Previous visit areas',
			sections: data.sections.filter((section) => section.kind === kind)
		}))
	);

	let newKind = $state('current');
	const field = 'h-11 w-full border border-rule bg-salt px-3 text-[14px] text-ink outline-none focus:border-ink';
</script>

<svelte:head>
	<title>{program.code} {data.visit.year} · AACCUP Desk</title>
</svelte:head>

<div>
	<PageHeader eyebrow={`${program.code} · Visit`} title={`${data.visit.year} · ${data.visit.label}`}>
		{#snippet actions()}
			{#if data.visit.status === 'active'}
				<span class="inline-flex h-10 items-center border border-ink/30 px-3 text-[13px] font-medium">Active visit</span>
			{:else if data.canManage}
				<form method="POST" action="?/activate" use:enhance>
					<button class="h-10 border border-ink bg-paper px-4 text-[13px] font-medium hover:bg-ink hover:text-paper">Make this the active visit</button>
				</form>
			{/if}
			<a href={publicUrl} use:fresh target="_blank" rel="noopener noreferrer" class="inline-flex h-10 items-center gap-2 border border-rule bg-paper px-4 text-[13px] font-medium hover:border-ink/30">
				Public page
				<ArrowUpRight class="size-4" />
			</a>
		{/snippet}
	</PageHeader>
</div>


<div class="mt-8 grid gap-10 xl:grid-cols-[1.35fr_1fr]">
	<section>
		{#each groups as group (group.kind)}
			<div class="mb-10">
				<div class="flex items-end justify-between border-b border-ink/20 pb-2">
					<h2 class="font-display text-[20px] font-semibold tracking-[-0.03em]">{group.label}</h2>
					<span class="font-mono text-[12px] text-ink-soft">{group.sections.length}</span>
				</div>
				<ul>
					{#each group.sections as section (section.id)}
						<li>
							<a href={sectionHref(program.id, data.visit.id, section.id)} class="group grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-rule px-1 py-3 hover:bg-paper sm:grid-cols-[2.5rem_minmax(0,1fr)_auto_auto_1rem] sm:px-3">
								<span class="font-mono text-[13px] text-ink-soft">{section.kind === 'common' ? '—' : section.number ? pad2(section.number) : '··'}</span>
								<span class="min-w-0">
									<span class="block truncate text-[14px] font-medium">{section.title}</span>
									<span class="block text-[12px] text-ink-soft">
										{section.linked}/{section.total} linked{section.unpublished ? ` · ${section.unpublished} not published` : ''}
										{#if section.drive_folder_name}· Drive: {section.drive_folder_name}{/if}
										{#if section.driveIssues}<span class="font-medium text-destructive"> · {section.driveIssues} need attention</span>{/if}
									</span>
								</span>
								<span class="hidden sm:block"><StatusBadge status={section.status} /></span>
								<span class="font-mono text-[12px] text-ink-soft sm:hidden">{section.status === 'published' ? '●' : '○'}</span>
								<ArrowRight class="hidden size-4 sm:block" />
							</a>
						</li>
					{:else}
						<li class="py-4 text-[13px] text-ink-soft">None yet.</li>
					{/each}
				</ul>
			</div>
		{/each}

		{#if data.canManage}
			<form method="POST" action="?/createSection" use:enhance class="grid gap-4 border border-rule bg-paper p-5 sm:grid-cols-2">
				<p class="font-display text-[18px] font-semibold sm:col-span-2">Add a section</p>
				<label class="grid gap-1.5 text-[13px] font-medium">
					Group
					<select name="kind" bind:value={newKind} class={field}>
						<option value="current">Current visit</option>
						<option value="previous">Previous visit area</option>
						{#if !hasCommon}<option value="common">Common documents</option>{/if}
					</select>
				</label>
				<label class="grid gap-1.5 text-[13px] font-medium">Number<input name="number" type="number" min="1" placeholder={newKind === 'previous' ? 'Area number' : 'Order'} class={field} /></label>
				<label class="grid gap-1.5 text-[13px] font-medium">Title<input name="title" required placeholder="Library" class={field} /></label>
				<label class="grid gap-1.5 text-[13px] font-medium">Short title<input name="short_title" placeholder="Shown in the sidebar" class={field} /></label>
				<label class="grid gap-1.5 text-[13px] font-medium">URL slug<input name="slug" placeholder="Made from the title" class={field} /></label>
				<label class="grid gap-1.5 text-[13px] font-medium">Sort order<input name="sort_order" type="number" value="100" class={field} /></label>
				<label class="grid gap-1.5 text-[13px] font-medium sm:col-span-2">Description<textarea name="description" rows="2" class="border border-rule bg-salt p-3 text-[14px] outline-none focus:border-ink"></textarea></label>
				<label class="grid gap-1.5 text-[13px] font-medium sm:col-span-2">What the evaluator will look for<textarea name="focus" rows="2" class="border border-rule bg-salt p-3 text-[14px] outline-none focus:border-ink"></textarea></label>
				<button class="h-11 bg-ink px-5 text-[14px] font-medium text-paper hover:bg-ink-soft sm:w-fit">Add section</button>
			</form>
		{/if}
	</section>

	<aside class="space-y-8">
		<form method="POST" action="?/update" use:enhance={() => async ({ update }) => update({ reset: false })}>
			<fieldset disabled={!data.canManage} class="grid gap-4 sm:grid-cols-2">
				<legend class="mb-3 font-display text-[20px] font-semibold tracking-[-0.03em]">Visit details</legend>
				<label class="grid gap-1.5 text-[13px] font-medium">Year<input name="year" type="number" value={data.visit.year} class={field} /></label>
				<label class="grid gap-1.5 text-[13px] font-medium">Level<input name="level" value={data.visit.level} class={field} /></label>
				<label class="grid gap-1.5 text-[13px] font-medium sm:col-span-2">Public label<input name="label" value={data.visit.label} class={field} /></label>
				<label class="grid gap-1.5 text-[13px] font-medium sm:col-span-2">Previous survey label<input name="previous_label" value={data.visit.previous_label ?? ''} placeholder="2024 survey" class={field} /></label>
				<label class="grid gap-1.5 text-[13px] font-medium">URL slug<input name="slug" value={data.visit.slug} class="{field} font-mono" /></label>
				<label class="grid gap-1.5 text-[13px] font-medium">Sort order<input name="sort_order" type="number" value={data.visit.sort_order} class={field} /></label>
				<label class="grid gap-1.5 text-[13px] font-medium sm:col-span-2">
					Visibility
					<select name="workflow" class={field}>
						<option value="published" selected={data.visit.workflow === 'published'}>Published — on the public site</option>
						<option value="draft" selected={data.visit.workflow !== 'published'}>Draft — hidden</option>
					</select>
				</label>
				{#if data.canManage}<button class="h-11 bg-ink px-5 text-[14px] font-medium text-paper hover:bg-ink-soft sm:w-fit">Save visit</button>{/if}
			</fieldset>
		</form>

		{#if data.canManage}


			<form method="POST" action="?/copyCommon" use:enhance class="border border-rule bg-paper p-5">
				<p class="flex items-center gap-2 font-display text-[18px] font-semibold"><Copy class="size-4" /> Copy common documents</p>
				<p class="mt-2 text-[13px] leading-relaxed text-ink-soft">
					Copies Certification, BOR, COPC, Checklist, and Additional documents from another program or visit into this visit’s common
					section, as separate draft rows. Nothing is shared; rename and relink each copy before publishing.
				</p>
				<label class="mt-4 grid gap-1.5 text-[13px] font-medium">
					Copy from
					<select name="from" required class={field}>
						<option value="">Choose a visit…</option>
						{#each data.sources as source (source.id)}<option value={source.id}>{source.label}</option>{/each}
					</select>
				</label>
				<button class="mt-4 h-11 border border-ink px-5 text-[14px] font-medium hover:bg-ink hover:text-paper" disabled={!hasCommon}>Copy as drafts</button>
				{#if !hasCommon}<p class="mt-2 text-[12px] text-destructive">Add a common-documents section first.</p>{/if}
			</form>
		{/if}
	</aside>
</div>

{#if data.drive.visit}
	<div class="mt-12">
		<DriveSetup setup={data.drive} canManage={data.canManage} />
	</div>
{/if}

