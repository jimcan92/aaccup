<script lang="ts">
	import { enhance } from '#lib/admin-enhance.js';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import BarChart3 from '@lucide/svelte/icons/chart-column';
	import GalleryHorizontal from '@lucide/svelte/icons/gallery-horizontal';
	import History from '@lucide/svelte/icons/history';
	import Images from '@lucide/svelte/icons/images';
	import Type from '@lucide/svelte/icons/type';
	import CircleHelp from '@lucide/svelte/icons/circle-help';
	import Columns2 from '@lucide/svelte/icons/columns-2';
	import Handshake from '@lucide/svelte/icons/handshake';
	import Megaphone from '@lucide/svelte/icons/megaphone';
	import Newspaper from '@lucide/svelte/icons/newspaper';
	import Quote from '@lucide/svelte/icons/quote';
	import Target from '@lucide/svelte/icons/target';
	import Users from '@lucide/svelte/icons/users';
	import Video from '@lucide/svelte/icons/video';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import Network from '@lucide/svelte/icons/network';
	import Plus from '@lucide/svelte/icons/plus';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import type { Snippet } from 'svelte';
	import { readMessage, type PreviewMessage, type ProgramPatch } from '#lib/block-preview.js';
	import { PreviewToggle } from '#lib/preview-toggle.svelte.js';
	import { pageBar } from '#lib/page-bar.svelte.js';
	import type { LandingBlock } from '#lib/landing.js';
	import X from '@lucide/svelte/icons/x';
	import { tick } from 'svelte';
	import LandingBlockEditor from '#lib/components/admin/landing-block-editor.svelte';
	import PreviewDialog from '#lib/components/admin/preview-dialog.svelte';
	import PreviewPane from '#lib/components/admin/preview-pane.svelte';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { blockLabel, type BlockKind } from '#lib/landing.js';
	import LandingBlocks from '#lib/components/program/landing-blocks.svelte';
	import { Skeleton } from '#lib/components/ui/skeleton/index.js';
	import { themeStyle } from '#lib/theme.js';
	import type { ProgramTheme } from '#lib/data/types.js';
	import { fresh } from '#lib/fresh-link.js';

	type Block = { id: string; kind: string; draft: unknown; published: unknown; updated_at: string };

	// The block list of a program page or the home page: sticky toolbar, editors, Add block dialog.
	let {
		label,
		publicHref,
		folderId,
		blocks,
		error,
		canEdit,
		canManage,
		empty,
		previewSrc,
		program,
		inBar = false,
		top
	}: {
		label: string;
		publicHref: string;
		/** Uploads go to programs/<folderId> in storage. */
		folderId: string;
		blocks: Block[];
		error: string | null;
		canEdit: boolean;
		canManage: boolean;
		/** Shown when there are no blocks yet. */
		empty: string;
		/** The page that renders this page's drafts for the preview frame. */
		previewSrc: string;
		/** The program's details as typed in `top`, unsaved; the preview shows them too. */
		program?: ProgramPatch;
		/** Inside a program: the buttons go to the program's sticky bar instead of a toolbar here. */
		inBar?: boolean;
		/** Shown under the toolbar in the editor column, above the blocks, so it sits beside the preview too. */
		top?: Snippet;
	} = $props();

	const preview = new PreviewToggle();
	const showSide = $derived(preview.side);
	let sideFrame = $state<HTMLIFrameElement>();
	let dialogFrame = $state<HTMLIFrameElement>();
	let selected = $state<string | null>(null);

	// What each editor holds right now, saved or not; the preview shows these.
	let current = $state<Record<string, string>>({});
	const previewBlocks = $derived(
		blocks.map((block) => {
			let content = block.draft;
			try {
				if (current[block.id]) content = JSON.parse(current[block.id]);
			} catch {
				// Keep the stored draft.
			}
			return { id: block.id, kind: block.kind, content } as LandingBlock;
		})
	);
	const drafts = $derived(blocks.filter((block) => block.published === null).map((block) => block.id));

	function post(message: PreviewMessage, frame?: HTMLIFrameElement) {
		for (const target of frame ? [frame] : [sideFrame, dialogFrame]) {
			target?.contentWindow?.postMessage($state.snapshot(message), location.origin);
		}
	}

	// Send edits to the preview a moment after typing stops.
	$effect(() => {
		const message: PreviewMessage = { type: 'aaccup:blocks', blocks: previewBlocks, drafts };
		const timer = setTimeout(() => post(message), 150);
		return () => clearTimeout(timer);
	});
	$effect(() => {
		if (!program) return;
		const message: PreviewMessage = { type: 'aaccup:program', program };
		const timer = setTimeout(() => post(message), 150);
		return () => clearTimeout(timer);
	});

	// A click on a block in the preview opens that block's editor.
	async function select(id: string) {
		preview.dialogOpen = false;
		selected = id;
		await tick();
		document.getElementById(`block-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		setTimeout(() => selected === id && (selected = null), 2000);
	}

	function onMessage(event: MessageEvent) {
		const message = readMessage(event);
		if (message?.type === 'aaccup:ready') {
			const frame = [sideFrame, dialogFrame].find((item) => item?.contentWindow === event.source);
			post({ type: 'aaccup:blocks', blocks: previewBlocks, drafts }, frame);
			if (program) post({ type: 'aaccup:program', program }, frame);
		}
		if (message?.type === 'aaccup:select') select(message.id);
	}

	// Working in an editor scrolls the side preview to that block.
	function follow(id: string) {
		if (showSide) post({ type: 'aaccup:scroll', id }, sideFrame);
	}

	let removing = $state<{ id: string; label: string } | null>(null);
	let adding = $state(false);

	// Add block: a new block of a kind, or a copy of a block from another page.
	type Source = {
		id: string;
		label: string;
		theme: ProgramTheme | null;
		blocks: { id: string; kind: BlockKind; label: string; title: string; live: boolean; content: unknown }[];
	};
	let addMode = $state<'new' | 'copy'>('new');
	let sources = $state<Source[] | null>(null);
	let sourcesError = $state<string | null>(null);
	let sourceId = $state('');
	let pickedId = $state('');
	const source = $derived(sources?.find((item) => item.id === sourceId) ?? sources?.[0]);
	const picked = $derived(source?.blocks.find((item) => item.id === pickedId) ?? source?.blocks[0]);
	let frameWidth = $state(0);
	let innerHeight = $state(0);
	const copyScale = $derived(frameWidth ? Math.min(1, frameWidth / 1280) : 0.5);

	// The other pages' blocks load the first time the copy view opens.
	$effect(() => {
		if (!adding || addMode !== 'copy' || sources) return;
		fetch(`/admin/blocks?exclude=${encodeURIComponent(folderId)}`)
			.then(async (response) => {
				if (!response.ok) throw new Error('The other pages’ blocks could not be loaded.');
				sources = (await response.json()).sources as Source[];
				sourceId = sources[0]?.id ?? '';
			})
			.catch((err) => (sourcesError = (err as Error).message));
	});
	$effect(() => {
		if (!adding) addMode = 'new';
	});

	const live = $derived(blocks.filter((block) => block.published !== null).length);

	$effect(() => {
		if (!inBar) return;
		pageBar.actions = [
			{ id: 'public', label: 'View public page', icon: ArrowUpRight, href: publicHref, external: true },
			{ id: 'preview', label: showSide ? 'Hide preview' : 'Preview', icon: showSide ? EyeOff : Eye, onclick: () => preview.toggle(), pressed: showSide },
			...(canEdit ? [{ id: 'add', label: 'Add block', icon: Plus, onclick: () => (adding = true), primary: true }] : [])
		];
		return () => (pageBar.actions = []);
	});

	// After adding, show the new block (always last) below the sticky toolbar.
	async function showNewest() {
		await tick();
		document.querySelector('#blocks > :last-child')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	const add = [
		{ kind: 'carousel', label: 'Photo carousel', icon: GalleryHorizontal, hint: 'A slideshow of photos with captions, one at a time' },
		{ kind: 'gallery', label: 'Photo gallery', icon: Images, hint: 'A grid of photos; the first one is the banner' },
		{ kind: 'stats', label: 'Highlights', icon: BarChart3, hint: 'Short figures: passing rate, graduates, years' },
		{ kind: 'text', label: 'Text section', icon: Type, hint: 'A heading and paragraphs: about, objectives' },
		{ kind: 'timeline', label: 'Timeline', icon: History, hint: 'Dated milestones down a line: the program’s history' },
		{ kind: 'people', label: 'Faculty & staff', icon: Users, hint: 'Photo cards with name, position and degree' },
		{ kind: 'vmgo', label: 'Vision & mission', icon: Target, hint: 'Vision and mission, with numbered goals and objectives' },
		{ kind: 'media', label: 'Photo & text', icon: Columns2, hint: 'A photo beside a heading, text and a button' },
		{ kind: 'partners', label: 'Partners & linkages', icon: Handshake, hint: 'Logos of partner agencies, LGUs and companies' },
		{ kind: 'testimonials', label: 'Testimonials', icon: Quote, hint: 'Short quotes from alumni and partners' },
		{ kind: 'faq', label: 'FAQ', icon: CircleHelp, hint: 'Questions that open to show the answer' },
		{ kind: 'video', label: 'Video', icon: Video, hint: 'A YouTube or Google Drive video' },
		{ kind: 'cta', label: 'Call to action', icon: Megaphone, hint: 'A coloured band with a line of text and buttons' },
		{ kind: 'news', label: 'Announcements', icon: Newspaper, hint: 'Dated news with optional links' },
		{ kind: 'org', label: 'Organization', icon: Network, hint: 'An org chart: director, offices and heads' },
		{ kind: 'events', label: 'Campus events', icon: CalendarDays, hint: 'Upcoming and past events with date, time and place' }
	] as const;
</script>

<svelte:window onmessage={onMessage} />

<div class={showSide ? 'grid grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-8' : ''}>
<div class="min-w-0">
{#if !inBar}
<!-- Stays in view while scrolling, so adding a block never means scrolling to the bottom. -->
<div class="sticky top-16 z-10 -mx-5 flex flex-wrap items-center gap-2 border-b border-rule bg-salt/95 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:top-0 {showSide ? 'xl:mx-0 xl:px-0' : ''}">
	<p class="mr-auto text-[13px] text-ink-soft">
		<span class="font-medium text-ink">{label}</span> · {blocks.length}
		{blocks.length === 1 ? 'block' : 'blocks'} · {live} live
	</p>
	<button type="button" onclick={() => preview.toggle()} class="inline-flex h-10 cursor-pointer items-center gap-2 border px-4 text-[13px] font-medium {showSide ? 'border-ink bg-paper' : 'border-rule bg-paper hover:border-ink/30'}" aria-pressed={preview.wide ? showSide : undefined}>
		{#if showSide}<EyeOff class="size-4" /> Hide preview{:else}<Eye class="size-4" /> Preview{/if}
	</button>
	<a href={publicHref} use:fresh target="_blank" rel="noopener noreferrer" class="inline-flex h-10 items-center gap-2 border border-rule bg-paper px-4 text-[13px] font-medium hover:border-ink/30">
		View public page <ArrowUpRight class="size-4" />
	</a>
	{#if canEdit}
		<button type="button" onclick={() => (adding = true)} class="inline-flex h-10 cursor-pointer items-center gap-2 bg-ink px-4 text-[13px] font-medium text-paper hover:bg-ink-soft">
			<Plus class="size-4" /> Add block
		</button>
	{/if}
</div>
{/if}

{#if error}<p class="mt-6 border border-destructive/30 bg-paper p-4 text-[14px] text-destructive" role="alert">{error}</p>{/if}

{#if top}<div class={inBar ? '' : 'mt-6'}>{@render top()}</div>{/if}

{#if inBar}
	<p class="mt-8 flex items-baseline gap-2 border-b border-ink/20 pb-2">
		<span class="font-display text-[20px] font-semibold tracking-[-0.03em]">Blocks</span>
		<span class="text-[13px] text-ink-soft">{blocks.length} · {live} live</span>
	</p>
{/if}

<div id="blocks" class="mt-6 space-y-5">
	{#each blocks as block, index (`${block.id}:${block.updated_at}`)}
		<div
			id={`block-${block.id}`}
			class="{inBar ? 'scroll-mt-[calc(var(--sticky-offset)+1rem)]' : 'scroll-mt-36 lg:scroll-mt-20'} transition-shadow duration-500 {selected === block.id ? 'shadow-[0_0_0_3px_var(--color-signal)]' : ''}"
			onfocusin={() => follow(block.id)}
		><LandingBlockEditor
			block={block as never}
			programId={folderId}
			first={index === 0}
			last={index === blocks.length - 1}
			{canEdit}
			{canManage}
			onremove={() => (removing = { id: block.id, label: blockLabel(block.kind as 'gallery', (block.draft as { layout?: string })?.layout) })}
			onchange={(content) => (current[block.id] = content)}
		/></div>
	{:else}
		<p class="border border-dashed border-ink/30 bg-paper p-6 text-[14px] text-ink-soft">
			{empty} Use <span class="font-medium text-ink">Add block</span> above.
		</p>
	{/each}
</div>
</div>

{#if showSide}
	<!-- The preview pane stays in view beside the editors. -->
	<PreviewPane src={previewSrc} hint="Preview · drafts included · click a block to edit it" bind:frame={sideFrame} />
{/if}
</div>

<PreviewDialog src={previewSrc} hint="Drafts included. Tap a block to edit it." bind:open={preview.dialogOpen} bind:frame={dialogFrame} />

<Dialog.Root bind:open={adding}>
	<Dialog.Content class="max-h-[90dvh] gap-0 overflow-y-auto rounded-none p-0 {addMode === 'copy' ? 'max-w-6xl sm:max-w-6xl' : 'max-w-3xl sm:max-w-3xl'}" showCloseButton={false}>
		<div class="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-rule bg-paper px-5 py-4">
			<div>
				<Dialog.Title class="font-display text-[20px] font-semibold tracking-[-0.03em]">Add a block</Dialog.Title>
				<Dialog.Description class="mt-1 text-[13px] text-ink-soft">It goes at the bottom of the page as a draft; move it with the arrows.</Dialog.Description>
				<div class="mt-3 inline-flex border border-rule" role="tablist" aria-label="Add a block">
					{#each [{ value: 'new', label: 'New block' }, { value: 'copy', label: 'Copy from another page' }] as option (option.value)}
						<button type="button" role="tab" aria-selected={addMode === option.value} onclick={() => (addMode = option.value as 'new' | 'copy')} class="h-9 cursor-pointer px-3 text-[13px] font-medium {addMode === option.value ? 'bg-ink text-paper' : 'bg-paper text-ink-soft hover:text-ink'}">{option.label}</button>
					{/each}
				</div>
			</div>
			<Dialog.Close class="grid size-9 shrink-0 cursor-pointer place-items-center text-ink-soft hover:bg-salt hover:text-ink" aria-label="Close"><X class="size-4" /></Dialog.Close>
		</div>
		{#if addMode === 'copy'}
			{#if sourcesError}
				<p class="m-5 border border-destructive/30 p-4 text-[14px] text-destructive" role="alert">{sourcesError}</p>
			{:else if !sources}
				<div class="grid gap-4 p-5 md:grid-cols-[18rem_minmax(0,1fr)]" role="status"><span class="sr-only">Loading blocks</span><Skeleton class="h-80" /><Skeleton class="h-80" /></div>
			{:else if !sources.length}
				<p class="p-5 text-[14px] text-ink-soft">No other page has blocks yet.</p>
			{:else}
				<div class="grid gap-5 p-5 md:grid-cols-[18rem_minmax(0,1fr)]">
					<div class="min-w-0">
						<label class="grid gap-1.5 text-[13px] font-medium">
							From
							<select bind:value={sourceId} onchange={() => (pickedId = '')} class="h-10 w-full border border-rule bg-salt px-3 text-[14px] outline-none focus:border-ink">
								{#each sources as item (item.id)}<option value={item.id}>{item.label} ({item.blocks.length})</option>{/each}
							</select>
						</label>
						<ul class="mt-3 max-h-[55dvh] overflow-y-auto border border-rule">
							{#each source?.blocks ?? [] as item (item.id)}
								<li>
									<button type="button" onclick={() => (pickedId = item.id)} aria-pressed={picked?.id === item.id} class="block w-full cursor-pointer border-b border-rule px-3 py-2.5 text-left last:border-b-0 {picked?.id === item.id ? 'bg-ink text-paper' : 'hover:bg-salt'}">
										<span class="block text-[13px] font-medium">{item.label}</span>
										<span class="block truncate text-[12px] {picked?.id === item.id ? 'text-paper/75' : 'text-ink-soft'}">{item.title || 'No heading'}{item.live ? '' : ' · draft'}</span>
									</button>
								</li>
							{/each}
						</ul>
					</div>

					<div class="min-w-0">
						<div class="flex flex-wrap items-center gap-2">
							<p class="mr-auto text-[12px] text-ink-soft">Preview · as it looks on {source?.label === 'Home page' ? 'the home page' : source?.label.split(' — ')[0]}</p>
							{#if picked && canEdit}
								<form
									method="POST"
									action="?/copy"
									use:enhance={() => async ({ result, update }) => {
										await update();
										if (result.type === 'success') {
											adding = false;
											showNewest();
										}
									}}
								>
									<input type="hidden" name="from" value={picked.id} />
									<button class="inline-flex h-10 cursor-pointer items-center gap-2 bg-ink px-4 text-[13px] font-medium text-paper hover:bg-ink-soft"><Plus class="size-4" /> Copy this block</button>
								</form>
							{/if}
						</div>
						<!-- A 1280px-wide page scaled to fit. The box scrolls; the block inside is inert (a picture only),
						     since an inert scroll box would not scroll. -->
						<div bind:clientWidth={frameWidth} class="mt-2 max-h-[55dvh] overflow-y-auto overflow-x-hidden border border-rule bg-salt">
							{#if picked}
								<div style="height: {innerHeight * copyScale}px" inert>
									<div bind:clientHeight={innerHeight} class="program-scope origin-top-left bg-salt" style="width: 1280px; transform: scale({copyScale}); {source?.theme ? themeStyle(source.theme) : ''}">
										{#key picked.id}
											<LandingBlocks blocks={[{ id: picked.id, kind: picked.kind, content: picked.content } as never]} editable />
										{/key}
									</div>
								</div>
							{/if}
						</div>
						<p class="mt-2 text-[12px] text-ink-soft">The copy is a separate draft: photos and links stay as they are. Change what belongs to the other page before publishing.</p>
					</div>
				</div>
			{/if}
		{:else}
		<div class="grid gap-2 p-5 sm:grid-cols-2">
			{#each add as option (option.kind)}
				{@const Icon = option.icon}
				<form
					method="POST"
					action="?/add"
					use:enhance={() => async ({ result, update }) => {
						await update();
						if (result.type === 'success') {
							adding = false;
							showNewest();
						}
					}}
				>
					<input type="hidden" name="kind" value={option.kind} />
					<button class="flex h-full w-full cursor-pointer items-start gap-3 border border-rule bg-paper p-3.5 text-left transition-colors hover:border-ink/30 hover:bg-salt">
						<span class="grid size-9 shrink-0 place-items-center bg-salt text-ink"><Icon class="size-4" /></span>
						<span class="min-w-0">
							<span class="block text-[14px] font-medium">{option.label}</span>
							<span class="block text-[12px] leading-snug text-ink-soft">{option.hint}</span>
						</span>
					</button>
				</form>
			{/each}
		</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root open={removing !== null} onOpenChange={(open) => !open && (removing = null)}>
	<Dialog.Content class="max-w-md rounded-none">
		<Dialog.Title class="font-display text-[20px] font-semibold tracking-[-0.03em]">Delete this {removing?.label.toLowerCase()}?</Dialog.Title>
		<Dialog.Description class="text-[14px] leading-relaxed text-ink-soft">It is removed from the page, draft and live copy. Uploaded photos stay in storage.</Dialog.Description>
		<form method="POST" action="?/delete" use:enhance={() => async ({ update }) => { await update(); removing = null; }} class="mt-2 flex justify-end gap-2">
			<input type="hidden" name="id" value={removing?.id ?? ''} />
			<button type="button" onclick={() => (removing = null)} class="h-10 border border-rule px-4 text-[14px]">Keep</button>
			<button class="h-10 bg-destructive px-4 text-[14px] font-medium text-white">Delete</button>
		</form>
	</Dialog.Content>
</Dialog.Root>
