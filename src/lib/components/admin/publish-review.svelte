<script lang="ts">
	import { enhance } from '#lib/admin-enhance.js';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import DocumentSkeleton from '#lib/components/site/document-skeleton.svelte';
	import FolderBrowser from '#lib/components/site/folder-browser.svelte';
	import FolderFileChoice from './folder-file-choice.svelte';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { driveFolderId, previewUrl } from '#lib/drive-url.js';
	import { kindLabel } from '#lib/format.js';
	import { cn } from '#lib/utils.js';

	type Doc = {
		id: string;
		title: string;
		code: string | null;
		kind: string;
		drive_url: string | null;
		workflow: string;
		drive_public: boolean | null;
		format: string;
		shown_files: string[] | null;
	};

	/**
	 * Review before publishing: each document shows its file (or folder) preview beside where it
	 * will sit on the section's public page, so nothing lands on the site unseen. `ids` is the
	 * queue: one document from its row's Publish, or every unpublished one from Publish all.
	 */
	let {
		ids = $bindable(),
		documents,
		trail,
		sectionKind,
		publicUrl
	}: {
		ids: string[] | null;
		documents: Doc[];
		/** Program · visit · section, as the visitor reaches the page. */
		trail: string[];
		sectionKind: string;
		publicUrl: string;
	} = $props();

	let index = $state(0);
	let frameLoading = $state(true);

	const queue = $derived(
		(ids ?? []).map((id) => documents.find((document) => document.id === id)).filter((document): document is Doc => !!document && document.workflow !== 'published')
	);
	const current = $derived(queue[Math.min(index, queue.length - 1)] ?? null);
	const embed = $derived(current ? previewUrl(current.drive_url ?? undefined) : null);
	const isFolder = $derived(!!current && !!driveFolderId(current.drive_url ?? undefined));
	// A folder document's file choice is saved with its publish (format 'folder' only, per the schema).
	const choosesFiles = $derived(isFolder && current?.format === 'folder');

	$effect(() => {
		void embed;
		frameLoading = true;
	});

	/** Where the document lands on the public page, following the page's own rules (dossier + section page). */
	const placement = $derived.by(() => {
		if (!current) return null;
		let shown = documents.filter((document) => document.workflow === 'published' || document.id === current.id);
		// Once a section has linked items, link-less placeholder rows are hidden.
		if (shown.some((document) => document.drive_url)) shown = shown.filter((document) => document.drive_url);
		if (!shown.includes(current)) return { hidden: true as const };
		const kinds = new Set(shown.map((document) => document.kind));
		const grouped = !(sectionKind === 'common' || kinds.size < 2 || shown.length <= 3);
		const list = grouped ? shown.filter((document) => document.kind === current.kind) : shown;
		const at = list.indexOf(current);
		const from = Math.max(0, at - 3);
		const to = Math.min(list.length, at + 4);
		return { hidden: false as const, grouped, before: from, after: list.length - to, window: list.slice(from, to), at: at + 1, size: list.length };
	});

	function close() {
		ids = null;
		index = 0;
	}

	function step(by: number) {
		index = (Math.min(index, queue.length - 1) + by + queue.length) % queue.length;
	}

	const afterPublish = () => async ({ update }: { update: () => Promise<void> }) => {
		await update();
		if (queue.length === 0) close();
	};
	const afterAll = () => async ({ update }: { update: () => Promise<void> }) => {
		await update();
		close();
	};
</script>

<Dialog.Root open={ids !== null && queue.length > 0} onOpenChange={(open) => !open && close()}>
	<Dialog.Content class="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-none p-0 sm:max-w-6xl">
		{#if current}
			<div class="flex flex-wrap items-center gap-3 border-b border-rule px-5 py-3 pr-12">
				<Dialog.Title class="min-w-0 flex-1 font-display text-[18px] font-semibold tracking-[-0.03em]">
					Review before publishing
				</Dialog.Title>
				{#if queue.length > 1}
					<div class="flex items-center gap-1 text-[13px] text-ink-soft">
						<button type="button" onclick={() => step(-1)} class="grid size-8 place-items-center hover:bg-paper" aria-label="Previous document"><ChevronLeft class="size-4" /></button>
						<span class="tabular-nums">{Math.min(index, queue.length - 1) + 1} of {queue.length}</span>
						<button type="button" onclick={() => step(1)} class="grid size-8 place-items-center hover:bg-paper" aria-label="Next document"><ChevronRight class="size-4" /></button>
					</div>
				{/if}
			</div>

			<div class="grid lg:grid-cols-[minmax(0,1fr)_22rem]">
				<div class="relative h-[45vh] border-b border-rule bg-salt lg:h-[72vh] lg:border-r lg:border-b-0">
					{#if isFolder}
						{#key current.id}
							<FolderBrowser documentId={current.id} title={current.title} preview />
						{/key}
					{:else if embed}
						{#key embed}
							{#if frameLoading}<DocumentSkeleton />{/if}
							<iframe
								src={embed}
								title={`Preview: ${current.title}`}
								class="relative h-full w-full border-0"
								onload={() => (frameLoading = false)}
								allow="autoplay; fullscreen"
								referrerpolicy="no-referrer"
							></iframe>
						{/key}
					{:else}
						<p class="grid h-full place-items-center p-6 text-center text-[14px] text-ink-soft">
							{current.drive_url ? 'This link cannot be previewed. Visitors will see “In preparation”.' : 'No link yet. Visitors will see “In preparation”.'}
						</p>
					{/if}
				</div>

				<div class="grid content-start gap-5 p-5">
					<div>
						<p class="text-[12px] font-medium tracking-wide text-ink-soft uppercase">Document</p>
						<p class="mt-1 text-[15px] font-medium break-words text-ink">
							{#if current.code}<span class="mr-1.5 border border-ink/20 px-1 font-mono text-[11px] text-ink-soft">{current.code}</span>{/if}{current.title}
						</p>
						<p class="mt-1 text-[12px] text-ink-soft">
							{kindLabel(current.kind)}{isFolder ? ' · Folder: visitors see the files inside it, as in this preview' : ''}
						</p>
						{#if current.drive_url}
							<a href={current.drive_url} target="_blank" rel="noopener noreferrer" class="mt-1 inline-flex items-center gap-1 text-[12px] underline underline-offset-2 hover:text-ink">
								Open in Drive <ArrowUpRight class="size-3" />
							</a>
						{/if}
						{#if current.drive_public === false}
							<p class="mt-2 border border-destructive/40 bg-destructive/5 p-2 text-[12px] font-medium text-destructive">
								Not shared publicly. Visitors will not be able to open it until it is shared as Anyone with the link.
							</p>
						{/if}
					</div>

					<div>
						<p class="flex items-center gap-1.5 text-[12px] font-medium tracking-wide text-ink-soft uppercase"><MapPin class="size-3.5" /> Where it goes</p>
						<p class="mt-1 text-[13px] leading-relaxed text-ink">
							{trail.join(' › ')}
						</p>
						<a href={publicUrl} target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 font-mono text-[12px] text-ink-soft underline underline-offset-2 hover:text-ink">
							{publicUrl} <ArrowUpRight class="size-3" />
						</a>

						{#if placement?.hidden}
							<p class="mt-3 border border-dashed border-ink/30 p-2 text-[12px] text-ink-soft">
								Hidden on the public page: this section has linked documents, and rows without a link are not shown.
							</p>
						{:else if placement}
							<p class="mt-3 text-[12px] text-ink-soft">
								{placement.grouped ? `Under “${kindLabel(current.kind)}”, ` : ''}item {placement.at} of {placement.size}:
							</p>
							<ol class="mt-1.5 border border-rule text-[13px]">
								{#if placement.before}<li class="px-2.5 py-1 text-[12px] text-ink-soft">… {placement.before} above</li>{/if}
								{#each placement.window as document (document.id)}
									<li
										class={cn(
											'border-rule px-2.5 py-1.5 not-first:border-t',
											document.id === current.id ? 'bg-signal/15 font-medium text-ink' : 'text-ink-soft'
										)}
									>
										<span class="line-clamp-2 break-words">{document.title}</span>
										{#if document.id === current.id}<span class="text-[11px] font-normal">← this document</span>{/if}
									</li>
								{/each}
								{#if placement.after}<li class="border-t border-rule px-2.5 py-1 text-[12px] text-ink-soft">… {placement.after} below</li>{/if}
							</ol>
							<p class="mt-1.5 text-[12px] text-ink-soft">To move it, change its Order in Edit.</p>
						{/if}
					</div>

					<div class="flex flex-wrap gap-2 border-t border-rule pt-4">
						<form method="POST" action="?/publishDocument" use:enhance={afterPublish} class="grid w-full gap-3">
							<input type="hidden" name="id" value={current.id} />
							{#if choosesFiles}
								{#key current.id}
									<FolderFileChoice documentId={current.id} shown={current.shown_files} compact />
								{/key}
							{/if}
							<button class="h-10 w-fit bg-ink px-4 text-[14px] font-medium text-paper hover:bg-ink-soft">{current.workflow === 'in_review' ? 'Approve & publish' : 'Publish this'}</button>
						</form>
						{#if queue.length > 1}
							<button type="button" onclick={() => step(1)} class="h-10 border border-rule px-4 text-[14px] hover:border-ink/30">Skip</button>
						{:else}
							<button type="button" onclick={close} class="h-10 border border-rule px-4 text-[14px] hover:border-ink/30">Cancel</button>
						{/if}
					</div>
					{#if queue.length > 1}
						<form method="POST" action="?/publishAll" use:enhance={afterAll} class="-mt-2">
							<button class="text-[12px] text-ink-soft underline underline-offset-4 hover:text-ink">Publish all {queue.length} without reviewing each</button>
						</form>
					{/if}
				</div>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
