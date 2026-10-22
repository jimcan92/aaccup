<script lang="ts">
	import { enhance } from '$lib/admin-enhance';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import ImagePlus from '@lucide/svelte/icons/image-plus';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import X from '@lucide/svelte/icons/x';
	import { toast } from 'svelte-sonner';
	import StatusBadge from '$lib/components/admin/status-badge.svelte';
	import { imageSrc } from '$lib/image-url';
	import { blockLabel, type BlockKind, type GalleryItem, type StatItem, type TimelineItem } from '$lib/landing';
	import CtaEditor from './blocks/cta-editor.svelte';
	import EventsEditor from './blocks/events-editor.svelte';
	import OrgEditor from './blocks/org-editor.svelte';
	import FaqEditor from './blocks/faq-editor.svelte';
	import MediaEditor from './blocks/media-editor.svelte';
	import NewsEditor from './blocks/news-editor.svelte';
	import PartnersEditor from './blocks/partners-editor.svelte';
	import PeopleEditor from './blocks/people-editor.svelte';
	import TestimonialsEditor from './blocks/testimonials-editor.svelte';
	import VideoEditor from './blocks/video-editor.svelte';
	import VmgoEditor from './blocks/vmgo-editor.svelte';

	type Block = {
		id: string;
		kind: BlockKind;
		draft: { title?: string; body?: string; items?: (GalleryItem | StatItem | TimelineItem)[]; [key: string]: unknown };
		published: unknown;
		status: string;
	};

	let {
		block,
		programId,
		first,
		last,
		canEdit,
		canManage,
		onremove,
		onchange
	}: {
		block: Block;
		programId: string;
		first: boolean;
		last: boolean;
		canEdit: boolean;
		canManage: boolean;
		onremove: () => void;
		/** The editor's current content (JSON), saved or not, for the live preview. */
		onchange?: (content: string) => void;
	} = $props();

	// Each editor keeps its own copy; the page re-mounts it after a save so it starts from the stored draft.
	// svelte-ignore state_referenced_locally
	let title = $state(block.draft.title ?? '');
	// svelte-ignore state_referenced_locally
	let body = $state(block.draft.body ?? '');
	// svelte-ignore state_referenced_locally
	let photos = $state<GalleryItem[]>(block.kind === 'gallery' ? ((block.draft.items ?? []) as GalleryItem[]).map((item) => ({ ...item })) : []);
	// svelte-ignore state_referenced_locally
	let stats = $state<StatItem[]>(block.kind === 'stats' ? ((block.draft.items ?? []) as StatItem[]).map((item) => ({ ...item })) : []);
	// svelte-ignore state_referenced_locally
	let milestones = $state<TimelineItem[]>(block.kind === 'timeline' ? ((block.draft.items ?? []) as TimelineItem[]).map((item) => ({ ...item })) : []);
	// svelte-ignore state_referenced_locally
	let layout = $state<'grid' | 'carousel'>((block.draft as { layout?: string }).layout === 'carousel' ? 'carousel' : 'grid');
	let uploading = $state<number | null>(null);

	// The newer kinds each have their own editor working on a copy of the whole draft; lists start empty when missing.
	const ownEditor = ['people', 'vmgo', 'media', 'partners', 'testimonials', 'faq', 'video', 'cta', 'news', 'org', 'events'];
	const lists: Record<string, string[]> = { vmgo: ['goals', 'objectives'], cta: ['buttons'] };
	// svelte-ignore state_referenced_locally
	let extra = $state<any>(
		Object.fromEntries([
			...(lists[block.kind] ?? (block.kind === 'media' || block.kind === 'video' ? [] : ['items'])).map((key) => [key, []]),
			...Object.entries(structuredClone(block.draft))
		])
	);

	const content = $derived(
		JSON.stringify(
			ownEditor.includes(block.kind)
				? { ...extra, title }
				: block.kind === 'text'
				? { title, body }
				: block.kind === 'stats'
					? { title, items: stats }
					: block.kind === 'timeline'
						? { title, items: milestones }
						: { title, layout, items: photos }
		)
	);
	const live = $derived(block.published !== null);
	$effect(() => onchange?.(content));

	const changed = $derived(live && JSON.stringify(block.published) !== JSON.stringify(block.draft));

	function move<T>(list: T[], index: number, delta: number): T[] {
		const next = [...list];
		const target = index + delta;
		if (target < 0 || target >= next.length) return next;
		[next[index], next[target]] = [next[target], next[index]];
		return next;
	}

	async function upload(index: number, file: File | undefined) {
		if (!file) return;
		uploading = index;
		const form = new FormData();
		form.set('file', file);
		form.set('folder', `programs/${programId}`);
		try {
			const response = await fetch('/admin/upload', { method: 'POST', body: form });
			const result = await response.json();
			if (!response.ok || !result.url) throw new Error(result.error ?? 'Upload failed.');
			photos[index].src = result.url;
			if (!photos[index].alt) photos[index].alt = file.name.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ');
		} catch (err) {
			toast.error((err as Error).message, { duration: 9000 });
		} finally {
			uploading = null;
		}
	}

	const field = 'h-10 w-full border border-rule bg-salt px-3 text-[14px] text-ink outline-none focus:border-ink disabled:opacity-60';
	const small = 'grid size-8 place-items-center text-ink-soft hover:bg-salt hover:text-ink disabled:opacity-30';
</script>

<article class="border border-rule bg-paper">
	<header class="flex flex-wrap items-center gap-2 border-b border-rule px-4 py-3">
		<p class="font-display text-[17px] font-semibold tracking-[-0.02em]">{blockLabel(block.kind, layout)}</p>
		<StatusBadge status={block.status} />
		<span class="text-[12px] text-ink-soft">
			{#if !live}Not on the public page yet{:else if changed}Live · has unpublished changes{:else}Live{/if}
		</span>
		<span class="ml-auto flex items-center gap-1">
			{#if canEdit}
				<form method="POST" action="?/move" use:enhance><input type="hidden" name="id" value={block.id} /><input type="hidden" name="direction" value="up" /><button class={small} disabled={first} aria-label="Move block up"><ArrowUp class="size-4" /></button></form>
				<form method="POST" action="?/move" use:enhance><input type="hidden" name="id" value={block.id} /><input type="hidden" name="direction" value="down" /><button class={small} disabled={last} aria-label="Move block down"><ArrowDown class="size-4" /></button></form>
			{/if}
			{#if canManage}
				<button type="button" onclick={onremove} class="{small} hover:text-destructive" aria-label="Delete block"><Trash2 class="size-4" /></button>
			{/if}
		</span>
	</header>

	<form method="POST" action="?/save" use:enhance={() => async ({ update }) => update({ reset: false })} class="grid gap-4 p-4">
		<input type="hidden" name="id" value={block.id} />
		<input type="hidden" name="kind" value={block.kind} />
		<input type="hidden" name="content" value={content} />

		<fieldset disabled={!canEdit} class="grid gap-4">
			<label class="grid gap-1.5 text-[13px] font-medium">
				{block.kind === 'text' ? 'Heading' : 'Heading (optional)'}
				<input bind:value={title} class={field} placeholder={block.kind === 'gallery' ? 'Campus life' : block.kind === 'stats' ? 'Highlights' : block.kind === 'timeline' ? 'Our history' : block.kind === 'text' ? 'About the program' : blockLabel(block.kind)} />
			</label>

			{#if block.kind === 'gallery'}
				<fieldset class="grid gap-1.5">
					<legend class="mb-1.5 text-[13px] font-medium">Show as</legend>
					<div class="flex flex-wrap gap-2">
						{#each [{ value: 'carousel', label: 'Carousel', hint: 'one photo at a time, slides on its own' }, { value: 'grid', label: 'Grid', hint: 'all photos at once' }] as option (option.value)}
							<label class="flex cursor-pointer items-center gap-2 border px-3 py-2 text-[13px] {layout === option.value ? 'border-ink bg-salt' : 'border-rule'}">
								<input type="radio" bind:group={layout} value={option.value} class="size-4" />
								<span><span class="font-medium">{option.label}</span> <span class="text-ink-soft">· {option.hint}</span></span>
							</label>
						{/each}
					</div>
				</fieldset>
			{/if}

			{#if block.kind === 'people'}
				<PeopleEditor bind:value={extra} {programId} />
			{:else if block.kind === 'vmgo'}
				<VmgoEditor bind:value={extra} />
			{:else if block.kind === 'media'}
				<MediaEditor bind:value={extra} {programId} />
			{:else if block.kind === 'partners'}
				<PartnersEditor bind:value={extra} {programId} />
			{:else if block.kind === 'testimonials'}
				<TestimonialsEditor bind:value={extra} {programId} />
			{:else if block.kind === 'faq'}
				<FaqEditor bind:value={extra} />
			{:else if block.kind === 'video'}
				<VideoEditor bind:value={extra} />
			{:else if block.kind === 'cta'}
				<CtaEditor bind:value={extra} />
			{:else if block.kind === 'news'}
				<NewsEditor bind:value={extra} />
			{:else if block.kind === 'org'}
				<OrgEditor bind:value={extra} {programId} />
			{:else if block.kind === 'events'}
				<EventsEditor bind:value={extra} />
			{:else if block.kind === 'text'}
				<label class="grid gap-1.5 text-[13px] font-medium">
					Text
					<textarea bind:value={body} rows="8" class="w-full border border-rule bg-salt p-3 text-[14px] leading-relaxed outline-none focus:border-ink" placeholder="Leave an empty line between paragraphs."></textarea>
				</label>
			{:else if block.kind === 'stats'}
				<div class="grid gap-2">
					{#each stats as stat, index (index)}
						<div class="grid grid-cols-[8rem_minmax(0,1fr)_auto] items-center gap-2">
							<input bind:value={stat.value} aria-label="Value" placeholder="95%" class="{field} font-display text-[16px] font-semibold" />
							<input bind:value={stat.label} aria-label="Label" placeholder="Board exam passing rate, 2024" class={field} />
							<button type="button" onclick={() => (stats = stats.filter((_, i) => i !== index))} class={small} aria-label="Remove highlight"><X class="size-4" /></button>
						</div>
					{/each}
					<button type="button" onclick={() => (stats = [...stats, { value: '', label: '' }])} class="inline-flex h-9 w-fit items-center gap-1.5 border border-rule px-3 text-[13px] font-medium hover:border-ink/30"><Plus class="size-4" /> Add highlight</button>
				</div>
			{:else if block.kind === 'timeline'}
				<div class="grid gap-3">
					{#each milestones as milestone, index (index)}
						<div class="grid gap-3 border border-rule p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
							<div class="grid gap-2">
								<div class="grid gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
									<input bind:value={milestone.year} aria-label="Year" placeholder="1947" class="{field} font-display text-[16px] font-semibold" />
									<input bind:value={milestone.title} aria-label="Title" placeholder="Founded as Moalboal Province High School" class={field} />
								</div>
								<textarea bind:value={milestone.body} aria-label="Details" rows="3" class="w-full border border-rule bg-salt p-3 text-[14px] leading-relaxed outline-none focus:border-ink" placeholder="What happened (optional). Leave an empty line between paragraphs."></textarea>
							</div>
							<div class="flex gap-1 sm:flex-col">
								<button type="button" onclick={() => (milestones = move(milestones, index, -1))} disabled={index === 0} class={small} aria-label="Move entry up"><ArrowUp class="size-4" /></button>
								<button type="button" onclick={() => (milestones = move(milestones, index, 1))} disabled={index === milestones.length - 1} class={small} aria-label="Move entry down"><ArrowDown class="size-4" /></button>
								<button type="button" onclick={() => (milestones = milestones.filter((_, i) => i !== index))} class={small} aria-label="Remove entry"><X class="size-4" /></button>
							</div>
						</div>
					{/each}
					<button type="button" onclick={() => (milestones = [...milestones, { year: '', title: '', body: '' }])} class="inline-flex h-9 w-fit items-center gap-1.5 border border-rule px-3 text-[13px] font-medium hover:border-ink/30"><Plus class="size-4" /> Add entry</button>
					<p class="text-[12px] text-ink-soft">Entries show in this order, oldest first is usual. The year can be a range, like 1977–1978.</p>
				</div>
			{:else}
				<div class="grid gap-3">
					{#if first}<p class="text-[12px] text-ink-soft">The first photo of the first gallery is also the banner behind the program title.</p>{/if}
					{#each photos as photo, index (index)}
						<div class="grid gap-3 border border-rule p-3 sm:grid-cols-[7rem_minmax(0,1fr)_auto]">
							<div class="grid aspect-[4/3] place-items-center overflow-hidden bg-salt">
								{#if photo.src}<img src={imageSrc(photo.src, 400)} alt="" class="h-full w-full object-cover" />{:else}<ImagePlus class="size-6 text-ink-soft" />{/if}
							</div>
							<div class="grid gap-2">
								<div class="flex flex-col gap-2 sm:flex-row">
									<input bind:value={photo.src} aria-label="Photo link" placeholder="Upload, or paste a Google Drive / image link" class="{field} font-mono text-[12px]" />
									<label class="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 border border-rule px-3 text-[13px] font-medium hover:border-ink/30">
										<ImagePlus class="size-4" /> {uploading === index ? 'Uploading…' : 'Upload'}
										<input type="file" accept="image/*" class="sr-only" onchange={(event) => upload(index, (event.currentTarget as HTMLInputElement).files?.[0])} />
									</label>
								</div>
								<input bind:value={photo.caption} aria-label="Caption" placeholder="Caption (shown under the photo)" class={field} />
								<input bind:value={photo.alt} aria-label="Description for screen readers" placeholder="What the photo shows (for screen readers)" class={field} />
							</div>
							<div class="flex gap-1 sm:flex-col">
								<button type="button" onclick={() => (photos = move(photos, index, -1))} disabled={index === 0} class={small} aria-label="Move photo up"><ArrowUp class="size-4" /></button>
								<button type="button" onclick={() => (photos = move(photos, index, 1))} disabled={index === photos.length - 1} class={small} aria-label="Move photo down"><ArrowDown class="size-4" /></button>
								<button type="button" onclick={() => (photos = photos.filter((_, i) => i !== index))} class={small} aria-label="Remove photo"><X class="size-4" /></button>
							</div>
						</div>
					{/each}
					<button type="button" onclick={() => (photos = [...photos, { src: '', alt: '', caption: '' }])} class="inline-flex h-9 w-fit items-center gap-1.5 border border-rule px-3 text-[13px] font-medium hover:border-ink/30"><Plus class="size-4" /> Add photo</button>
					<p class="text-[12px] text-ink-soft">Uploads up to 5 MB. Drive photos must be shared as “Anyone with the link”.</p>
				</div>
			{/if}
		</fieldset>

		{#if canEdit}
			<div class="flex flex-wrap items-center gap-2 border-t border-rule pt-4">
				<button class="h-10 bg-ink px-4 text-[13px] font-medium text-paper hover:bg-ink-soft">Save draft</button>
				{#if !canManage}
					<button formaction="?/submit" class="h-10 border border-ink px-4 text-[13px] font-medium hover:bg-ink hover:text-paper">Submit for review</button>
				{/if}
				{#if canManage}
					<button formaction="?/publish" class="h-10 border border-ink px-4 text-[13px] font-medium hover:bg-ink hover:text-paper">Publish</button>
				{/if}
				{#if canManage && live}
					<button formaction="?/unpublish" class="h-10 px-3 text-[13px] text-ink-soft underline-offset-4 hover:text-ink hover:underline">Take off public page</button>
				{/if}
				<span class="text-[12px] text-ink-soft">Submit and Publish also save your changes.</span>
			</div>
		{/if}
	</form>
</article>
