<script lang="ts">
	import type { SubmitFunction } from '$app/forms';
	import { enhance } from '#lib/admin-enhance.js';
	import Check from '@lucide/svelte/icons/check';
	import CircleDashed from '@lucide/svelte/icons/circle-dashed';
	import Copy from '@lucide/svelte/icons/copy';
	import FolderSync from '@lucide/svelte/icons/folder-sync';
	import Hand from '@lucide/svelte/icons/hand';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import { expectedFolderName, folderTree } from '#lib/drive-names.js';
	import type { DriveSetup } from '#lib/server/drive-setup.js';

	let { setup, canManage, canSync = canManage }: { setup: DriveSetup; canManage: boolean; canSync?: boolean } = $props();

	const visit = $derived(setup.visit!);
	const folderUrl = (id: string) => `https://drive.google.com/drive/folders/${id}`;
	const rootName = $derived(`${visit.code} AACCUP ${visit.year} (${visit.label})`);
	const tree = $derived(folderTree(rootName, setup.sections));
	const matched = $derived(setup.sections.filter((section) => section.folderId).length);

	let editing = $state<string | null>(null);
	let copied = $state(false);

	// These forms post to the visit and section pages' actions; the enhance wrapper shows
	// their message as a toast and the spinner on the button. navigate: false keeps the admin
	// on this page (SvelteKit 3 otherwise moves to the page that owns the action).
	const submit: SubmitFunction = () => async ({ result, update }) => {
		if (result.type === 'success') editing = null;
		await update({ reset: false, navigate: false });
	};

	async function copyTree() {
		try {
			await navigator.clipboard.writeText(tree);
			copied = true;
			setTimeout(() => copied = false, 2000);
		} catch {
			copied = false;
		}
	}

	const field = 'h-10 w-full border border-rule bg-salt px-3 font-mono text-[12px] text-ink outline-none focus:border-ink';
</script>

<section class="border border-rule bg-paper" aria-labelledby="drive-heading">
	<header class="flex flex-wrap items-start justify-between gap-3 border-b border-rule p-5">
		<div>
			<h2 id="drive-heading" class="flex items-center gap-2 font-display text-[20px] font-semibold tracking-[-0.03em]">
				<FolderSync class="size-5" /> Google Drive
			</h2>
			<p class="mt-1 text-[13px] text-ink-soft">
				{visit.year} · {visit.label} · {matched} of {setup.sections.length} sections have a folder
			</p>
		</div>
		{#if canSync && setup.configured && (visit.rootFolderId || matched)}
			<form method="POST" action={`/admin/visits/${visit.id}?/syncDrive`} use:enhance={submit}>
				<button class="inline-flex h-10 items-center gap-2 bg-ink px-4 text-[13px] font-medium text-paper hover:bg-ink-soft">
					<FolderSync class="size-4" />
					Sync now
				</button>
			</form>
		{/if}
	</header>


	<div class="grid gap-6 p-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
		<div class="min-w-0 space-y-6">
			{#if !setup.configured}
				<p class="border border-dashed border-destructive/40 p-3 text-[13px] leading-relaxed text-destructive">
					Drive sync is off on this deployment. Add <code class="font-mono text-[12px]">GOOGLE_SERVICE_ACCOUNT_JSON</code> in Vercel and redeploy.
				</p>
			{/if}

			<div>
				<p class="text-[14px] font-medium">1 · One folder for the whole visit</p>
				<p class="mt-1 text-[13px] leading-relaxed text-ink-soft">
					Share it with
					{#if setup.email}<strong class="break-all font-medium text-ink">{setup.email}</strong>{:else}the service account{/if}
					as Viewer. Subfolders named like the guide are matched to sections on every sync.
				</p>
				{#if canManage}
					<form method="POST" action={`/admin/visits/${visit.id}?/setRootFolder`} use:enhance={submit} class="mt-3 flex flex-col gap-2 sm:flex-row">
						<input
							name="folder"
							aria-label="Root folder link"
							value={visit.rootFolderId ? folderUrl(visit.rootFolderId) : ''}
							placeholder="https://drive.google.com/drive/folders/…"
							class={field}
						/>
						<button class="h-10 shrink-0 border border-ink px-4 text-[13px] font-medium hover:bg-ink hover:text-paper">
							Save folder
						</button>
					</form>
				{:else if visit.rootFolderId}
					<a href={folderUrl(visit.rootFolderId)} target="_blank" rel="noopener noreferrer" class="mt-2 inline-block text-[13px] underline underline-offset-2">Open root folder</a>
				{/if}
				{#if setup.lastRun}
					{@const run = setup.lastRun}
					<p class="mt-2 text-[12px] text-ink-soft">
						Last sync {new Date(run.started_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
						({run.trigger === 'schedule' ? 'daily' : 'manual'}): {run.added} new, {run.missing} missing, {run.not_public} not public{(run.errors as string[]).length
							? `, ${(run.errors as string[]).length} problems`
							: ''}.
					</p>
				{/if}
			</div>

			<div>
				<p class="text-[14px] font-medium">2 · Folder per section</p>
				<p class="mt-1 text-[13px] text-ink-soft">Matched automatically from the root folder, or set one by hand.</p>
				<ul class="mt-3 border-t border-rule">
					{#each setup.sections as section (section.id)}
						<li class="border-b border-rule py-2.5">
							<div class="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-start gap-2.5">
								<span class="mt-0.5" aria-hidden="true">
									{#if section.issues}
										<TriangleAlert class="size-4 text-destructive" />
									{:else if section.folderId && section.folderSource === 'manual'}
										<Hand class="size-4 text-ink" />
									{:else if section.folderId}
										<Check class="size-4 text-bsfi" />
									{:else}
										<CircleDashed class="size-4 text-ink-soft" />
									{/if}
								</span>
								<span class="min-w-0">
									<span class="block truncate text-[13px] font-medium">{expectedFolderName(section)}</span>
									<span class="block truncate text-[12px] text-ink-soft">
										{#if section.folderId}
											<a href={folderUrl(section.folderId)} target="_blank" rel="noopener noreferrer" class="underline underline-offset-2 hover:text-ink">
												{section.folderName ?? 'Folder'}</a
											>
											· {section.folderSource === 'manual' ? 'set by hand' : 'matched'} · {section.fromDrive} from Drive
											{#if section.issues}<span class="font-medium text-destructive"> · {section.issues} need attention</span>{/if}
										{:else}
											No folder yet
										{/if}
									</span>
								</span>
								{#if canManage}
									<button
										type="button"
										onclick={() => editing = editing === section.id ? null : section.id}
										class="h-8 px-2 text-[12px] font-medium underline-offset-4 hover:underline"
										aria-expanded={editing === section.id}
									>
										{editing === section.id ? 'Cancel' : 'Set folder'}
									</button>
								{/if}
							</div>
							{#if editing === section.id}
								<form method="POST" action={`/admin/sections/${section.id}?/setFolder`} use:enhance={submit} class="mt-2 flex flex-col gap-2 pl-7 sm:flex-row">
									<input
										name="folder"
										aria-label={`Folder link for ${section.title}`}
										value={section.folderSource === 'manual' && section.folderId ? folderUrl(section.folderId) : ''}
										placeholder="Folder link, or leave empty for automatic"
										class={field}
									/>
									<button class="h-10 shrink-0 bg-ink px-4 text-[13px] font-medium text-paper hover:bg-ink-soft">Save</button>
								</form>
							{/if}
						</li>
					{/each}
				</ul>
				<p class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-soft">
					<span class="inline-flex items-center gap-1"><Check class="size-3.5 text-bsfi" /> matched</span>
					<span class="inline-flex items-center gap-1"><Hand class="size-3.5" /> set by hand</span>
					<span class="inline-flex items-center gap-1"><CircleDashed class="size-3.5" /> no folder</span>
					<span class="inline-flex items-center gap-1"><TriangleAlert class="size-3.5 text-destructive" /> files not public or missing</span>
				</p>
			</div>
		</div>

		<aside class="min-w-0">
			<div class="flex items-center justify-between gap-2">
				<p class="text-[14px] font-medium">Naming guide</p>
				<button type="button" onclick={copyTree} class="inline-flex h-8 items-center gap-1.5 border border-rule px-2.5 text-[12px] font-medium hover:border-ink/30">
					{#if copied}<Check class="size-3.5" /> Copied{:else}<Copy class="size-3.5" /> Copy names{/if}
				</button>
			</div>
			<pre class="mt-2 overflow-x-auto border border-rule bg-salt p-3 font-mono text-[12px] leading-relaxed text-ink">{tree}</pre>
			<ul class="mt-3 space-y-1.5 text-[12px] leading-relaxed text-ink-soft">
				<li>• A folder with <strong class="font-medium text-ink">“Common”</strong> in its name holds the common documents.</li>
				<li>• <strong class="font-medium text-ink">“Area 1” … “Area 10”</strong> go to the previous-visit areas. Roman numerals work too (“Area IV”, “Area IX”).</li>
				<li>• Other folders match a section when the name contains its title, e.g. “02 INSTRUCTION” or “Area 4 – Linkages and Consortia”.</li>
				<li>
					• Folders may be grouped one level down. A group named with <strong class="font-medium text-ink">“Previous”, “Findings”, or “Compliance”</strong> holds
					the previous-visit areas; one named with <strong class="font-medium text-ink">“Level III” or “Current”</strong> holds the current sections, where
					“Area 1 – Instruction” is matched by its title.
				</li>
				<li>• Numbers in front only keep Drive in order; capitals and dashes do not matter. Folders that match nothing are skipped.</li>
				<li>• Inside a section folder, each file or indicator subfolder (e.g. “INS-04 OBE syllabi…”) becomes one draft document.</li>
				<li>• Share files as “Anyone with the link — Viewer”.</li>
			</ul>
		</aside>
	</div>
</section>
