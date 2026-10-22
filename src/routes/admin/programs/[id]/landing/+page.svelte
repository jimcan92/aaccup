<script lang="ts">
	import { enhance } from '$lib/admin-enhance';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
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
	import LandingBlockEditor from '$lib/components/admin/landing-block-editor.svelte';
	import PageHeader from '$lib/components/admin/page-header.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { blockLabel } from '$lib/landing';
	import { fresh } from '$lib/fresh-link';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let removing = $state<{ id: string; label: string } | null>(null);

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
		{ kind: 'news', label: 'Announcements', icon: Newspaper, hint: 'Dated news with optional links' }
	] as const;
</script>

<svelte:head>
	<title>{data.program.code} page · AACCUP Desk</title>
</svelte:head>

<a href={`/admin/programs/${data.program.id}`} class="inline-flex min-h-9 items-center gap-2 text-[13px] text-ink-soft hover:text-ink">
	<ArrowLeft class="size-4" />
	{data.program.code}
</a>

<div class="mt-4">
	<PageHeader
		eyebrow={`${data.program.code} · Program page`}
		title="The program’s front page"
		description={`What visitors see first at /${data.program.slug}: a photo banner, highlights, and text, above the link to the documents. Changes stay as drafts until a focal person or admin publishes them.`}
	>
		{#snippet actions()}
			<a href={`/${data.program.slug}`} use:fresh target="_blank" rel="noopener noreferrer" class="inline-flex h-10 items-center gap-2 border border-rule bg-paper px-4 text-[13px] font-medium hover:border-ink/30">
				View public page <ArrowUpRight class="size-4" />
			</a>
		{/snippet}
	</PageHeader>
</div>

{#if data.error}<p class="mt-6 border border-destructive/30 bg-paper p-4 text-[14px] text-destructive" role="alert">{data.error}</p>{/if}

<div class="mt-8 space-y-5">
	{#each data.blocks as block, index (`${block.id}:${block.updated_at}`)}
		<LandingBlockEditor
			block={block as never}
			programId={data.program.id}
			first={index === 0}
			last={index === data.blocks.length - 1}
			canEdit={data.canEdit}
			canManage={data.canManage}
			onremove={() => (removing = { id: block.id, label: blockLabel(block.kind as 'gallery', (block.draft as { layout?: string })?.layout) })}
		/>
	{:else}
		<p class="border border-dashed border-ink/30 bg-paper p-6 text-[14px] text-ink-soft">
			No blocks yet. The public page shows the program title, summary, and the link to the documents until you add some.
		</p>
	{/each}
</div>

{#if data.canEdit}
	<section class="mt-8" aria-labelledby="add-heading">
		<h2 id="add-heading" class="font-display text-[18px] font-semibold tracking-[-0.02em]">Add a block</h2>
		<div class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each add as option (option.kind)}
				{@const Icon = option.icon}
				<form method="POST" action="?/add" use:enhance>
					<input type="hidden" name="kind" value={option.kind} />
					<button class="flex h-full w-full flex-col items-start gap-1 border border-rule bg-paper p-4 text-left transition-colors hover:border-ink/30">
						<span class="flex items-center gap-2 text-[14px] font-medium"><Icon class="size-4" /> {option.label}</span>
						<span class="text-[12px] text-ink-soft">{option.hint}</span>
					</button>
				</form>
			{/each}
		</div>
	</section>
{/if}

<Dialog.Root open={removing !== null} onOpenChange={(open) => !open && (removing = null)}>
	<Dialog.Content class="max-w-md rounded-none">
		<Dialog.Title class="font-display text-[20px] font-semibold tracking-[-0.03em]">Delete this {removing?.label.toLowerCase()}?</Dialog.Title>
		<Dialog.Description class="text-[14px] leading-relaxed text-ink-soft">It is removed from the program page, draft and live copy. Uploaded photos stay in storage.</Dialog.Description>
		<form method="POST" action="?/delete" use:enhance={() => async ({ update }) => { await update(); removing = null; }} class="mt-2 flex justify-end gap-2">
			<input type="hidden" name="id" value={removing?.id ?? ''} />
			<button type="button" onclick={() => (removing = null)} class="h-10 border border-rule px-4 text-[14px]">Keep</button>
			<button class="h-10 bg-destructive px-4 text-[14px] font-medium text-white">Delete</button>
		</form>
	</Dialog.Content>
</Dialog.Root>
