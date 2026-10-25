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
	import Monitor from '@lucide/svelte/icons/monitor';
	import Smartphone from '@lucide/svelte/icons/smartphone';
	import { onMount, type Snippet } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { readMessage, type PreviewMessage } from '#lib/block-preview.js';
	import { adminUi } from '#lib/admin-ui.svelte.js';
	import type { LandingBlock } from '#lib/landing.js';
	import X from '@lucide/svelte/icons/x';
	import { tick } from 'svelte';
	import LandingBlockEditor from '#lib/components/admin/landing-block-editor.svelte';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { blockLabel } from '#lib/landing.js';
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
		/** Shown under the toolbar in the editor column, above the blocks, so it sits beside the preview too. */
		top?: Snippet;
	} = $props();

	// Preview: beside the editors on wide screens (open by default, remembered); a fullscreen dialog otherwise.
	const wide = new MediaQuery('min-width: 1280px', false);
	let sideOpen = $state(true);
	let dialogOpen = $state(false);
	let device = $state<'desktop' | 'phone'>('desktop');
	let sideFrame = $state<HTMLIFrameElement>();
	let dialogFrame = $state<HTMLIFrameElement>();
	let paneWidth = $state(0);
	let paneHeight = $state(0);
	let selected = $state<string | null>(null);
	const showSide = $derived(wide.current && sideOpen);

	// The sidebar shrinks to icons only while the side preview is open; leaving the page restores it.
	$effect(() => {
		adminUi.compact = showSide;
		return () => (adminUi.compact = false);
	});

	onMount(() => {
		try {
			sideOpen = localStorage.getItem('aaccup:preview-side') !== 'closed';
		} catch {
			// Private windows may refuse storage; the preview just starts open.
		}
	});

	function togglePreview() {
		if (!wide.current) {
			dialogOpen = true;
			return;
		}
		sideOpen = !sideOpen;
		try {
			localStorage.setItem('aaccup:preview-side', sideOpen ? 'open' : 'closed');
		} catch {
			// Not remembered; fine.
		}
	}

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

	// A click on a block in the preview opens that block's editor.
	async function select(id: string) {
		dialogOpen = false;
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
		}
		if (message?.type === 'aaccup:select') select(message.id);
	}

	// Working in an editor scrolls the side preview to that block.
	function follow(id: string) {
		if (showSide) post({ type: 'aaccup:scroll', id }, sideFrame);
	}

	// Desktop preview: a 1280px-wide page scaled down to fit the pane.
	const scale = $derived(device === 'desktop' && paneWidth ? Math.min(1, paneWidth / 1280) : 1);

	let removing = $state<{ id: string; label: string } | null>(null);
	let adding = $state(false);

	const live = $derived(blocks.filter((block) => block.published !== null).length);

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

{#snippet frame(bind: 'side' | 'dialog')}
	{#if bind === 'side'}
		<iframe bind:this={sideFrame} src={previewSrc} title="Page preview" class="border-0 bg-salt" style={device === 'desktop' ? `width: 1280px; height: ${paneHeight / scale}px; transform: scale(${scale}); transform-origin: top left;` : 'width: 390px; height: 100%;'}></iframe>
	{:else}
		<iframe bind:this={dialogFrame} src={previewSrc} title="Page preview" class="h-full w-full border-0 bg-salt"></iframe>
	{/if}
{/snippet}

<div class={showSide ? 'grid grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-8' : ''}>
<div class="min-w-0">
<!-- Stays in view while scrolling, so adding a block never means scrolling to the bottom. -->
<div class="sticky top-16 z-10 -mx-5 flex flex-wrap items-center gap-2 border-b border-rule bg-salt/95 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:top-0 {showSide ? 'xl:mx-0 xl:px-0' : ''}">
	<p class="mr-auto text-[13px] text-ink-soft">
		<span class="font-medium text-ink">{label}</span> · {blocks.length}
		{blocks.length === 1 ? 'block' : 'blocks'} · {live} live
	</p>
	<button type="button" onclick={togglePreview} class="inline-flex h-10 cursor-pointer items-center gap-2 border px-4 text-[13px] font-medium {showSide ? 'border-ink bg-paper' : 'border-rule bg-paper hover:border-ink/30'}" aria-pressed={wide.current ? showSide : undefined}>
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

{#if error}<p class="mt-6 border border-destructive/30 bg-paper p-4 text-[14px] text-destructive" role="alert">{error}</p>{/if}

{#if top}<div class="mt-6">{@render top()}</div>{/if}

<div id="blocks" class="mt-6 space-y-5">
	{#each blocks as block, index (`${block.id}:${block.updated_at}`)}
		<div
			id={`block-${block.id}`}
			class="scroll-mt-36 transition-shadow duration-500 lg:scroll-mt-20 {selected === block.id ? 'shadow-[0_0_0_3px_var(--color-signal)]' : ''}"
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
	<aside class="sticky top-4 flex h-[calc(100dvh-2rem)] flex-col self-start border border-rule bg-paper" aria-label="Page preview">
		<div class="flex items-center gap-2 border-b border-rule px-3 py-2">
			<p class="mr-auto text-[12px] text-ink-soft">Preview · drafts included · click a block to edit it</p>
			{#each [{ value: 'desktop', label: 'Desktop', icon: Monitor }, { value: 'phone', label: 'Phone', icon: Smartphone }] as option (option.value)}
				{@const Icon = option.icon}
				<button type="button" onclick={() => (device = option.value as 'desktop' | 'phone')} class="grid size-8 cursor-pointer place-items-center {device === option.value ? 'bg-ink text-paper' : 'text-ink-soft hover:bg-salt hover:text-ink'}" aria-pressed={device === option.value} title={option.label}>
					<Icon class="size-4" /><span class="sr-only">{option.label}</span>
				</button>
			{/each}
		</div>
		<div bind:clientWidth={paneWidth} bind:clientHeight={paneHeight} class="relative min-h-0 flex-1 overflow-hidden {device === 'phone' ? 'flex justify-center bg-salt' : ''}">
			{@render frame('side')}
		</div>
	</aside>
{/if}
</div>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content class="flex h-dvh max-h-dvh w-screen max-w-none flex-col gap-0 rounded-none border-none p-0 sm:max-w-none" showCloseButton={false}>
		<div class="flex items-center gap-3 border-b border-rule bg-paper px-4 py-3">
			<div class="mr-auto min-w-0">
				<Dialog.Title class="font-display text-[17px] font-semibold tracking-[-0.02em]">Preview</Dialog.Title>
				<Dialog.Description class="text-[12px] text-ink-soft">Drafts included. Tap a block to edit it.</Dialog.Description>
			</div>
			<Dialog.Close class="grid size-10 shrink-0 cursor-pointer place-items-center text-ink-soft hover:bg-salt hover:text-ink" aria-label="Close preview"><X class="size-5" /></Dialog.Close>
		</div>
		<div class="min-h-0 flex-1">{#if dialogOpen}{@render frame('dialog')}{/if}</div>
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={adding}>
	<Dialog.Content class="max-h-[90dvh] max-w-3xl gap-0 overflow-y-auto rounded-none p-0 sm:max-w-3xl" showCloseButton={false}>
		<div class="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-rule bg-paper px-5 py-4">
			<div>
				<Dialog.Title class="font-display text-[20px] font-semibold tracking-[-0.03em]">Add a block</Dialog.Title>
				<Dialog.Description class="mt-1 text-[13px] text-ink-soft">It goes at the bottom of the page as a draft; move it with the arrows.</Dialog.Description>
			</div>
			<Dialog.Close class="grid size-9 shrink-0 cursor-pointer place-items-center text-ink-soft hover:bg-salt hover:text-ink" aria-label="Close"><X class="size-4" /></Dialog.Close>
		</div>
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
