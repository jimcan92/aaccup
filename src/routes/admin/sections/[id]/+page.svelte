<script lang="ts">
	import { enhance } from '#lib/admin-enhance.js';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import ClipboardPaste from '@lucide/svelte/icons/clipboard-paste';
	import FolderSync from '@lucide/svelte/icons/folder-sync';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import PageHeader from '#lib/components/admin/page-header.svelte';
	import StatusBadge from '#lib/components/admin/status-badge.svelte';
	import DocumentFormat from '#lib/components/site/document-format.svelte';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { previewUrl } from '#lib/drive-url.js';
	import { formatDate, kindLabel } from '#lib/format.js';
	import { fresh } from '#lib/fresh-link.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	type Visit = { id: string; slug: string; year: number; label: string; status: string; program: { id: string; code: string; slug: string } };
	const visit = $derived(data.section.visit as unknown as Visit);
	const program = $derived(visit.program);
	const groupLabel = $derived(
		data.section.kind === 'common' ? 'Common documents' : data.section.kind === 'current' ? 'Current visit' : 'Previous visit'
	);
	const publicUrl = $derived(
		`/${program.slug}${visit.status === 'active' ? '' : `/${visit.slug}`}/${data.section.slug}`
	);
	const unpublished = $derived(data.documents.filter((document) => document.workflow !== 'published').length);
	const linked = $derived(data.documents.filter((document) => document.status === 'linked').length);

	let editing = $state<string | null>(null);
	let adding = $state<'one' | 'bulk' | null>(null);
	let removing = $state<{ id: string; title: string } | null>(null);
	let removingSection = $state(false);
	let bulk = $state('');
	const bulkCount = $derived(bulk.split(/\r?\n/).filter((line) => /https?:\/\//.test(line)).length);

	const field = 'h-11 w-full border border-rule bg-salt px-3 text-[14px] text-ink outline-none focus:border-ink disabled:opacity-60';
	const area = 'w-full border border-rule bg-salt p-3 text-[14px] leading-relaxed outline-none focus:border-ink disabled:opacity-60';
	const keep = () => async ({ update }: { update: (options?: { reset?: boolean }) => Promise<void> }) => update({ reset: false });
	const close = () => async ({ update }: { update: () => Promise<void> }) => {
		await update();
		editing = null;
		adding = null;
		removing = null;
	};
</script>

<svelte:head>
	<title>{data.section.title} · {program.code} · AACCUP Desk</title>
</svelte:head>

{#snippet documentFields(document?: (typeof data.documents)[number])}
	<label class="grid gap-1.5 text-[13px] font-medium sm:col-span-2">Title<input name="title" required value={document?.title ?? ''} class={field} /></label>
	<label class="grid gap-1.5 text-[13px] font-medium sm:col-span-2">
		Drive link
		<input name="drive_url" type="url" placeholder="https://drive.google.com/…" value={document?.drive_url ?? ''} class="{field} font-mono text-[13px]" />
		<span class="text-[12px] font-normal text-ink-soft">Leave empty to show “In preparation”. Share the file as Anyone with the link — Viewer.</span>
	</label>
	<label class="grid gap-1.5 text-[13px] font-medium">
		Type
		<select name="kind" class={field}>
			{#each data.kinds as kind (kind)}<option value={kind} selected={(document?.kind ?? 'supporting') === kind}>{kindLabel(kind)}</option>{/each}
		</select>
	</label>
	<label class="grid gap-1.5 text-[13px] font-medium">
		Format
		<select name="format" class={field}>
			<option value="">Guess from the link</option>
			{#each data.formats as format (format)}<option value={format} selected={document?.format === format}>{format.toUpperCase()}</option>{/each}
		</select>
	</label>
	<label class="grid gap-1.5 text-[13px] font-medium">Updated (date)<input name="updated_label" type="date" value={document?.updated_label ?? ''} class={field} /></label>
	<label class="grid gap-1.5 text-[13px] font-medium">Order<input name="sort_order" type="number" value={document?.sort_order ?? 0} class={field} /></label>
	<label class="grid gap-1.5 text-[13px] font-medium sm:col-span-2">Note<textarea name="note" rows="2" class={area}>{document?.note ?? ''}</textarea></label>
{/snippet}

<a href={`/admin/visits/${visit.id}`} class="inline-flex min-h-9 items-center gap-2 text-[13px] text-ink-soft hover:text-ink">
	<ArrowLeft class="size-4" />
	{program.code} · {visit.year} {visit.label}
</a>

<div class="mt-4">
	<PageHeader
		eyebrow={`${program.code} · ${groupLabel}${data.section.number ? ` · ${data.section.number}` : ''}`}
		title={data.section.title}
		description={`${linked} of ${data.documents.length} documents linked${unpublished ? ` · ${unpublished} not published yet` : ''}`}
	>
		{#snippet actions()}
			<StatusBadge status={data.section.status} />
			{#if data.canEdit && ['draft', 'approved'].includes(data.section.status)}
				<form method="POST" action="?/submitSection" use:enhance><button class="h-10 border border-ink px-4 text-[13px] font-medium hover:bg-ink hover:text-paper">Submit section</button></form>
			{/if}
			{#if data.canManage && data.section.status !== 'published'}
				<form method="POST" action="?/publishSection" use:enhance><button class="h-10 bg-ink px-4 text-[13px] font-medium text-paper hover:bg-ink-soft">Publish section</button></form>
			{/if}
			<a href={publicUrl} use:fresh target="_blank" rel="noopener noreferrer" class="inline-flex h-10 items-center gap-2 border border-rule bg-paper px-4 text-[13px] font-medium hover:border-ink/30">
				Public page <ArrowUpRight class="size-4" />
			</a>
		{/snippet}
	</PageHeader>
</div>


{#if !data.canEdit}
	<p class="mt-6 border border-dashed border-ink/30 bg-paper p-4 text-[13px] text-ink-soft">You can read this section. Editing is for admins, focal persons, and the assigned area chair.</p>
{/if}

<div class="mt-8 grid gap-10 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
	<section aria-labelledby="documents-heading">
		<div class="flex flex-wrap items-end justify-between gap-3 border-b border-ink/20 pb-2">
			<h2 id="documents-heading" class="font-display text-[20px] font-semibold tracking-[-0.03em]">Documents</h2>
			<div class="flex flex-wrap gap-2">
				{#if data.canEdit}
					<button type="button" onclick={() => (adding = adding === 'one' ? null : 'one')} class="inline-flex h-9 items-center gap-1.5 border border-rule bg-paper px-3 text-[13px] font-medium hover:border-ink/30" aria-expanded={adding === 'one'}>
						<Plus class="size-4" /> Add one
					</button>
					<button type="button" onclick={() => (adding = adding === 'bulk' ? null : 'bulk')} class="inline-flex h-9 items-center gap-1.5 border border-rule bg-paper px-3 text-[13px] font-medium hover:border-ink/30" aria-expanded={adding === 'bulk'}>
						<ClipboardPaste class="size-4" /> Paste links
					</button>
				{/if}
				{#if data.canManage && unpublished > 0}
					<form method="POST" action="?/publishAll" use:enhance><button class="h-9 bg-ink px-3 text-[13px] font-medium text-paper hover:bg-ink-soft">Publish all ({unpublished})</button></form>
				{/if}
			</div>
		</div>

		{#if adding === 'one'}
			<form method="POST" action="?/addDocument" use:enhance={close} class="mt-4 grid gap-4 border border-rule bg-paper p-5 sm:grid-cols-2">
				{@render documentFields()}
				<button class="h-11 bg-ink px-5 text-[14px] font-medium text-paper hover:bg-ink-soft sm:w-fit">Add document</button>
			</form>
		{:else if adding === 'bulk'}
			<form method="POST" action="?/bulkAdd" use:enhance={close} class="mt-4 grid gap-4 border border-rule bg-paper p-5">
				<label class="grid gap-1.5 text-[13px] font-medium">
					One document per line
					<textarea name="links" rows="7" bind:value={bulk} class="{area} font-mono text-[13px]" placeholder={'Area 3 — Recommendations | https://drive.google.com/file/d/…\nSyllabi folder\thttps://drive.google.com/drive/folders/…\nhttps://docs.google.com/document/d/…'}></textarea>
					<span class="text-[12px] font-normal text-ink-soft">
						Title, then the link (separated by |, a tab, or a space). Columns pasted from a spreadsheet work. The format is guessed from the link.
					</span>
				</label>
				<div class="flex flex-wrap items-end gap-4">
					<label class="grid gap-1.5 text-[13px] font-medium">
						Type for all
						<select name="kind" class={field}>
							{#each data.kinds as kind (kind)}<option value={kind} selected={kind === 'supporting'}>{kindLabel(kind)}</option>{/each}
						</select>
					</label>
					{#if data.canManage}
						<label class="flex h-11 items-center gap-2 text-[13px]"><input type="checkbox" name="publish" class="size-4" /> Publish now</label>
					{/if}
					<button class="h-11 bg-ink px-5 text-[14px] font-medium text-paper hover:bg-ink-soft" disabled={bulkCount === 0}>
						Add {bulkCount || ''} {bulkCount === 1 ? 'link' : 'links'}
					</button>
				</div>
			</form>
		{/if}

		<ul>
			{#each data.documents as document (document.id)}
				<li class="border-b border-rule py-3">
					<div class="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-3 sm:grid-cols-[2.75rem_minmax(0,1fr)_auto] sm:items-center">
						<DocumentFormat format={document.format} />
						<div class="min-w-0">
							<p class="text-[14px] font-medium text-ink">{document.title}</p>
							<p class="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-ink-soft">
								<span>{kindLabel(document.kind)}</span>
								{#if document.drive_url}
									<a href={document.drive_url} target="_blank" rel="noopener noreferrer" class="inline-flex max-w-[16rem] items-center gap-1 truncate underline underline-offset-2 hover:text-ink">
										Open link <ArrowUpRight class="size-3" />
									</a>
									{#if !previewUrl(document.drive_url)}
										<span class="border border-destructive/40 bg-destructive/5 px-1 font-medium text-destructive">Not a Drive link — shows as In preparation</span>
									{/if}
								{:else}
									<span class="border border-dashed border-ink/30 px-1">In preparation</span>
								{/if}
								{#if document.updated_label}<span>{formatDate(document.updated_label)}</span>{/if}
								{#if document.source === 'drive'}<span class="border border-ink/20 px-1">From Drive</span>{/if}
								{#if document.drive_missing}
									<span class="border border-destructive/40 bg-destructive/5 px-1 font-medium text-destructive">Missing in Drive — hidden</span>
								{:else if document.drive_public === false}
									<span class="border border-destructive/40 bg-destructive/5 px-1 font-medium text-destructive">Not shared publicly</span>
								{/if}
							</p>
						</div>
						<div class="col-start-2 flex flex-wrap items-center gap-1.5 sm:col-start-3 sm:justify-end">
							<StatusBadge status={document.workflow} />
							{#if data.canEdit}
								<button type="button" onclick={() => (editing = editing === document.id ? null : document.id)} class="grid size-9 place-items-center hover:bg-paper" aria-label={`Edit ${document.title}`} aria-expanded={editing === document.id}>
									<Pencil class="size-4" />
								</button>
							{/if}
							{#if data.canEdit && document.workflow === 'draft'}
								<form method="POST" action="?/submitDocument" use:enhance>
									<input type="hidden" name="id" value={document.id} />
									<button class="h-9 px-2 text-[12px] font-medium underline-offset-4 hover:underline">Submit</button>
								</form>
							{/if}
							{#if data.canManage && document.workflow !== 'published'}
								<form method="POST" action="?/publishDocument" use:enhance>
									<input type="hidden" name="id" value={document.id} />
									<button class="h-9 px-2 text-[12px] font-medium underline-offset-4 hover:underline">Publish</button>
								</form>
							{/if}
							{#if data.canManage}
								<button type="button" onclick={() => (removing = { id: document.id, title: document.title })} class="grid size-9 place-items-center text-ink-soft hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete ${document.title}`}>
									<Trash2 class="size-4" />
								</button>
							{/if}
						</div>
					</div>

					{#if editing === document.id}
						<form method="POST" action="?/saveDocument" use:enhance={close} class="mt-3 grid gap-4 bg-paper p-4 sm:grid-cols-2">
							<input type="hidden" name="id" value={document.id} />
							{@render documentFields(document)}
							<button class="h-11 bg-ink px-5 text-[14px] font-medium text-paper hover:bg-ink-soft sm:w-fit">Save</button>
						</form>
					{/if}
				</li>
			{:else}
				<li class="py-8 text-[14px] text-ink-soft">No documents yet. Add one, or paste a list of Drive links.</li>
			{/each}
		</ul>
	</section>

	<aside class="space-y-8">
		<form method="POST" action="?/updateSection" use:enhance={keep}>
			<fieldset disabled={!data.canManage} class="grid gap-4 sm:grid-cols-2">
				<legend class="mb-3 font-display text-[20px] font-semibold tracking-[-0.03em]">Section details</legend>
				<label class="grid gap-1.5 text-[13px] font-medium sm:col-span-2">Title<input name="title" required value={data.section.title} class={field} /></label>
				<label class="grid gap-1.5 text-[13px] font-medium sm:col-span-2">Short title<input name="short_title" value={data.section.short_title ?? ''} class={field} /></label>
				<label class="grid gap-1.5 text-[13px] font-medium">URL slug<input name="slug" value={data.section.slug} class="{field} font-mono" /></label>
				<label class="grid gap-1.5 text-[13px] font-medium">Number<input name="number" type="number" value={data.section.number ?? ''} class={field} /></label>
				<label class="grid gap-1.5 text-[13px] font-medium">Sort order<input name="sort_order" type="number" value={data.section.sort_order} class={field} /></label>
				<label class="grid gap-1.5 text-[13px] font-medium sm:col-span-2">Description<textarea name="description" rows="3" class={area}>{data.section.description ?? ''}</textarea></label>
				<label class="grid gap-1.5 text-[13px] font-medium sm:col-span-2">What the evaluator will look for<textarea name="focus" rows="3" class={area}>{data.section.focus ?? ''}</textarea></label>
				{#if data.canManage}<button class="h-11 bg-ink px-5 text-[14px] font-medium text-paper hover:bg-ink-soft sm:w-fit">Save section</button>{/if}
			</fieldset>
		</form>

		<section class="border border-rule bg-paper p-5">
			<p class="flex items-center gap-2 font-display text-[18px] font-semibold"><FolderSync class="size-4" /> Google Drive</p>
			<p class="mt-2 text-[13px] leading-relaxed text-ink-soft">
				{#if data.section.drive_folder_id}
					Folder:
					<a href={`https://drive.google.com/drive/folders/${data.section.drive_folder_id}`} target="_blank" rel="noopener noreferrer" class="font-medium text-ink underline underline-offset-2">
						{data.section.drive_folder_name ?? 'Open folder'}
					</a>
					({data.section.drive_folder_source === 'manual' ? 'set by hand' : 'matched automatically'}).
					{#if data.section.drive_synced_at}Last synced {new Date(data.section.drive_synced_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}.{/if}
				{:else}
					No folder yet. Set the visit’s root folder and sync, or paste this section’s folder below.
				{/if}
			</p>
			{#if data.canEdit && data.driveConfigured && data.section.drive_folder_id}
				<form method="POST" action="?/syncSection" use:enhance class="mt-3">
					<button class="inline-flex h-10 items-center gap-2 bg-ink px-4 text-[13px] font-medium text-paper hover:bg-ink-soft"><FolderSync class="size-4" /> Sync this section</button>
				</form>
			{/if}
			{#if data.canManage}
				<form method="POST" action="?/setFolder" use:enhance={keep} class="mt-4 grid gap-2 border-t border-rule pt-4">
					<label class="grid gap-1.5 text-[13px] font-medium">
						Use a specific folder
						<input name="folder" placeholder="https://drive.google.com/drive/folders/…" value={data.section.drive_folder_source === 'manual' && data.section.drive_folder_id ? `https://drive.google.com/drive/folders/${data.section.drive_folder_id}` : ''} class="{field} font-mono text-[12px]" />
						<span class="text-[12px] font-normal text-ink-soft">Leave empty and save to go back to automatic matching.</span>
					</label>
					<button class="h-10 w-fit border border-ink px-4 text-[13px] font-medium hover:bg-ink hover:text-paper">Save folder</button>
				</form>
			{/if}
		</section>

		<section>
			<h2 class="font-display text-[20px] font-semibold tracking-[-0.03em]">History</h2>
			<ol class="mt-3 border-t border-rule">
				{#each data.history as row (row.id)}
					<li class="border-b border-rule py-2.5 text-[13px]">
						<span class="font-medium">{row.actor}</span>
						<span class="text-ink-soft">{row.action.replace('_', ' ')} {row.entity === 'area' ? 'the section' : `“${row.title}”`}</span>
						<span class="block font-mono text-[11px] text-ink-soft">{new Date(row.created_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}</span>
					</li>
				{:else}
					<li class="py-3 text-[13px] text-ink-soft">Submits and publishes appear here.</li>
				{/each}
			</ol>
		</section>

		{#if !data.canManage && data.canEdit}
			<p class="text-[12px] text-ink-soft">Section details are edited by a focal person or admin. You can add, edit, and submit documents.</p>
		{/if}
		{#if data.canManage}
			<button type="button" onclick={() => (removingSection = true)} class="inline-flex h-10 items-center gap-2 border border-destructive/40 px-4 text-[13px] font-medium text-destructive hover:bg-destructive/10">
				<Trash2 class="size-4" /> Delete this section
			</button>
		{/if}
	</aside>
</div>

<Dialog.Root open={removing !== null} onOpenChange={(open) => !open && (removing = null)}>
	<Dialog.Content class="max-w-md rounded-none">
		<Dialog.Title class="font-display text-[20px] font-semibold tracking-[-0.03em]">Delete “{removing?.title}”?</Dialog.Title>
		<Dialog.Description class="text-[14px] leading-relaxed text-ink-soft">The row is removed from this section. The file in Google Drive is not touched.</Dialog.Description>
		<form method="POST" action="?/deleteDocument" use:enhance={close} class="mt-2 flex justify-end gap-2">
			<input type="hidden" name="id" value={removing?.id ?? ''} />
			<button type="button" onclick={() => (removing = null)} class="h-10 border border-rule px-4 text-[14px]">Keep</button>
			<button class="h-10 bg-destructive px-4 text-[14px] font-medium text-white">Delete</button>
		</form>
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={removingSection}>
	<Dialog.Content class="max-w-md rounded-none">
		<Dialog.Title class="font-display text-[20px] font-semibold tracking-[-0.03em]">Delete “{data.section.title}”?</Dialog.Title>
		<Dialog.Description class="text-[14px] leading-relaxed text-ink-soft">
			This also deletes its {data.documents.length} document {data.documents.length === 1 ? 'row' : 'rows'}. Drive files are not touched. This cannot be undone.
		</Dialog.Description>
		<form method="POST" action="?/deleteSection" class="mt-2 flex justify-end gap-2">
			<button type="button" onclick={() => (removingSection = false)} class="h-10 border border-rule px-4 text-[14px]">Keep</button>
			<button class="h-10 bg-destructive px-4 text-[14px] font-medium text-white">Delete section</button>
		</form>
	</Dialog.Content>
</Dialog.Root>
