<script lang="ts">
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Eye from '@lucide/svelte/icons/eye';
	import FileText from '@lucide/svelte/icons/file-text';
	import X from '@lucide/svelte/icons/x';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { driveThumbnail, previewUrl } from '#lib/drive-url.js';
	import type { DocumentsContent } from '#lib/landing.js';
	import Section from './section.svelte';

	// Key records (BOR resolution, COPC, past results, certificates) as page-like cards.
	// Each card shows the file's first page from Drive; a click reads the file here.
	let { content, tone }: { content: DocumentsContent; tone: 'paper' | 'salt' } = $props();

	const previews = $derived(content.items.map((item) => previewUrl(item.url)));
	// Only linked documents open; the arrows step through those.
	const openable = $derived(content.items.map((_, index) => index).filter((index) => previews[index]));

	let open = $state<number | null>(null);
	let broken = $state<Record<number, boolean>>({});
	const current = $derived(open === null ? null : content.items[open]);

	function step(delta: number) {
		if (open === null || openable.length < 2) return;
		const at = openable.indexOf(open);
		open = openable[(at + delta + openable.length) % openable.length];
	}
</script>

<Section title={content.title} {tone}>
	{#if content.intro}<p class="-mt-4 mb-8 max-w-[68ch] text-[15px] leading-relaxed text-ink-soft sm:text-[16px]">{content.intro}</p>{/if}
	<ul class="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
		{#each content.items as item, index (index)}
			{@const thumb = driveThumbnail(item.url, 640)}
			<li class="min-w-0">
				{#if previews[index]}
					<button type="button" onclick={() => (open = index)} class="group block w-full text-left" aria-label={`Read ${item.title}`}>
						<span class="relative block aspect-[210/297] overflow-hidden border border-rule bg-salt shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:shadow-xl group-focus-visible:-translate-y-1 group-focus-visible:shadow-xl">
							{#if thumb && !broken[index]}
								<img src={thumb} alt="" loading="lazy" referrerpolicy="no-referrer" onerror={() => (broken[index] = true)} class="h-full w-full bg-white object-cover object-top" />
							{:else}
								<span class="grid h-full w-full place-items-center bg-paper text-program"><FileText class="size-12" strokeWidth={1.25} /></span>
							{/if}
							<span class="absolute inset-x-0 top-0 h-1 bg-program"></span>
							<span class="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-ink/85 py-2.5 text-[13px] font-medium text-paper opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
								<Eye class="size-4" /> Read the document
							</span>
						</span>
						{#if item.label}<span class="mt-3 block font-mono text-[11px] uppercase tracking-[0.06em] text-program">{item.label}</span>{/if}
						<span class="mt-1 block text-balance font-display text-[17px] font-semibold leading-snug tracking-[-0.02em] text-ink group-hover:text-program sm:text-[18px]">{item.title}</span>
					</button>
				{:else}
					<div aria-label={`${item.title}, in preparation`}>
						<span class="grid aspect-[210/297] place-items-center border border-dashed border-ink/25 bg-paper text-ink-soft">
							<span class="grid justify-items-center gap-2 text-center">
								<FileText class="size-10" strokeWidth={1.25} />
								<span class="font-mono text-[11px] uppercase tracking-[0.06em]">In preparation</span>
							</span>
						</span>
						{#if item.label}<span class="mt-3 block font-mono text-[11px] uppercase tracking-[0.06em] text-ink-soft">{item.label}</span>{/if}
						<span class="mt-1 block text-balance font-display text-[17px] font-semibold leading-snug tracking-[-0.02em] text-ink-soft sm:text-[18px]">{item.title}</span>
					</div>
				{/if}
			</li>
		{/each}
	</ul>
</Section>

<Dialog.Root open={open !== null} onOpenChange={(value) => !value && (open = null)}>
	<Dialog.Content
		class="flex h-[100dvh] max-w-none flex-col gap-0 rounded-none border-none bg-ink p-0 text-paper sm:h-[92vh] sm:max-w-[min(96vw,64rem)]"
		showCloseButton={false}
		onkeydown={(event: KeyboardEvent) => {
			if (event.key === 'ArrowRight') step(1);
			if (event.key === 'ArrowLeft') step(-1);
		}}
	>
		{#if current && open !== null}
			<div class="flex items-center gap-3 px-4 py-3">
				<div class="min-w-0 flex-1">
					{#if current.label}<p class="truncate font-mono text-[11px] uppercase tracking-[0.06em] text-paper/60">{current.label}</p>{/if}
					<Dialog.Title class="truncate font-display text-[16px] font-semibold tracking-[-0.02em]">{current.title}</Dialog.Title>
					<Dialog.Description class="sr-only">Preview of {current.title}</Dialog.Description>
				</div>
				{#if openable.length > 1}
					<button type="button" onclick={() => step(-1)} class="grid size-9 place-items-center hover:bg-paper/10" aria-label="Previous document"><ChevronLeft class="size-5" /></button>
					<span class="font-mono text-[12px] text-paper/70">{openable.indexOf(open) + 1} / {openable.length}</span>
					<button type="button" onclick={() => step(1)} class="grid size-9 place-items-center hover:bg-paper/10" aria-label="Next document"><ChevronRight class="size-5" /></button>
				{/if}
				<a href={current.url} target="_blank" rel="noopener noreferrer" class="hidden h-9 items-center gap-1.5 border border-paper/30 px-3 text-[13px] font-medium hover:bg-paper/10 sm:inline-flex">
					Open in Drive <ArrowUpRight class="size-4" />
				</a>
				<Dialog.Close class="grid size-9 place-items-center hover:bg-paper/10" aria-label="Close"><X class="size-5" /></Dialog.Close>
			</div>
			{#key open}
				<iframe src={previews[open]} title={current.title} class="min-h-0 w-full flex-1 border-0 bg-white" allow="autoplay"></iframe>
			{/key}
			<a href={current.url} target="_blank" rel="noopener noreferrer" class="flex h-11 items-center justify-center gap-1.5 border-t border-paper/15 text-[13px] font-medium sm:hidden">
				Open in Drive <ArrowUpRight class="size-4" />
			</a>
		{/if}
	</Dialog.Content>
</Dialog.Root>
