<script lang="ts">
	import RichText from '#lib/components/site/rich-text.svelte';
	import Photo from '#lib/components/site/photo.svelte';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import HandHeart from '@lucide/svelte/icons/hand-heart';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Play from '@lucide/svelte/icons/play';
	import Users from '@lucide/svelte/icons/users';
	import X from '@lucide/svelte/icons/x';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { imageSrc } from '#lib/image-url.js';
	import { videoEmbed, type ProjectsContent } from '#lib/landing.js';
	import { reveal, stagger } from '#lib/motion.js';

	// Extension projects: the video presentation and a few figures first, then a card for each project.
	// A card opens the project: its photos, the full text, and a link to its documents.
	let { content, tone }: { content: ProjectsContent; tone: 'paper' | 'salt' } = $props();

	const id = $props.id();
	const background = { paper: 'bg-paper', salt: 'bg-salt' };
	const card = { paper: 'bg-salt', salt: 'bg-paper' };
	const embed = $derived(videoEmbed(content.video));
	const items = $derived(content.items ?? []);
	const stats = $derived(content.stats ?? []);

	let open = $state<number | null>(null);
	let photo = $state(0);
	const current = $derived(open === null ? null : items[open]);
	// The opened card's slides: its video first (when it has one), then its photos.
	type Slide = { kind: 'video' | 'photo'; src: string };
	const slides = $derived.by((): Slide[] => {
		if (!current) return [];
		const video = videoEmbed(current.video);
		const photos = [current.photo, ...(current.photos ?? [])].filter((src): src is string => Boolean(src));
		return [...(video ? [{ kind: 'video' as const, src: video }] : []), ...photos.map((src) => ({ kind: 'photo' as const, src }))];
	});
	const slide = $derived(slides[photo]);

	function show(index: number) {
		open = index;
		photo = 0;
	}
	function step(delta: number) {
		if (slides.length > 1) photo = (photo + delta + slides.length) % slides.length;
	}
	const external = (href: string) => /^https?:/.test(href);
</script>

<section class="border-b border-rule {background[tone]}" aria-labelledby={content.title ? `${id}-heading` : undefined}>
	<div class="mx-auto max-w-[1280px] px-5 py-16 sm:px-8">
		<div class="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] lg:items-end lg:gap-12">
			<div class={embed ? '' : 'lg:col-span-2'}>
				<p class="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-program"><HandHeart class="size-3.5" /> Extension</p>
				{#if content.title}
					<h2 id={`${id}-heading`} class="mt-3 text-balance font-display text-[clamp(1.7rem,3.4vw,2.8rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-ink">{content.title}</h2>
				{/if}
				{#if embed}
					<figure class="mt-6">
						<div class="aspect-video w-full overflow-hidden bg-ink shadow-[0_30px_80px_-35px_rgba(0,0,0,0.5)]">
							<iframe src={embed} title={content.videoCaption || content.title || 'Extension video'} class="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe>
						</div>
						{#if content.videoCaption}<figcaption class="mt-3 text-[14px] text-ink-soft">{content.videoCaption}</figcaption>{/if}
					</figure>
				{/if}
			</div>

			<div class={embed ? 'lg:pb-10' : 'lg:col-span-2'}>
				{#if content.intro}
					<div class="max-w-[60ch] space-y-4 text-[15px] leading-relaxed text-ink-soft sm:text-[16px]"><RichText text={content.intro} /></div>
				{/if}
				{#if stats.length}
					<!-- Figures share the row evenly, however many there are; beside the video they stack. -->
					<dl class="mt-6 flex flex-wrap gap-px border border-rule bg-rule">
						{#each stats as stat, i (i)}
							<div class="min-w-0 flex-1 basis-[9rem] {embed ? 'lg:basis-full' : ''} {card[tone]} p-4" use:reveal={{ delay: stagger(i) }}>
								<dd class="font-display text-[clamp(1.8rem,3.4vw,2.5rem)] font-semibold leading-none tracking-[-0.05em] text-program">{stat.value}</dd>
								<dt class="mt-1.5 text-[13px] leading-snug text-ink-soft">{stat.label}</dt>
							</div>
						{/each}
					</dl>
				{/if}
			</div>
		</div>

		{#if items.length}
			<ul class="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
				{#each items as item, i (i)}
					<li class="min-w-0" use:reveal={{ delay: stagger(i) }}>
						<button type="button" onclick={() => show(i)} class="group flex h-full w-full flex-col overflow-hidden border border-rule {card[tone]} text-left transition duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:-translate-y-1 focus-visible:shadow-xl" aria-label={`Open ${item.title}`}>
							<span class="relative block aspect-[4/3] overflow-hidden bg-program/10">
								{#if item.photo}
									<Photo src={item.photo} alt="" width={900} class="h-full w-full" imgClass="transition-transform duration-500 group-hover:scale-[1.04]" />
								{:else}
									<span class="grid h-full place-items-center text-program/50"><HandHeart class="size-10" strokeWidth={1.25} /></span>
								{/if}
								{#if item.photos?.length || item.video}
									<span class="absolute bottom-2 right-2 flex gap-1 font-mono text-[11px] text-paper">
										{#if item.video}<span class="inline-flex items-center gap-1 bg-program px-2 py-1 text-program-contrast"><Play class="size-3" />Video</span>{/if}
										{#if item.photos?.length}<span class="bg-ink/75 px-2 py-1">+{item.photos.length} photos</span>{/if}
									</span>
								{/if}
							</span>
							<span class="flex flex-1 flex-col p-5">
								{#if item.date || item.partner}
									<span class="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-[0.04em] text-program">
										{#if item.date}<span class="inline-flex items-center gap-1"><CalendarDays class="size-3.5" />{item.date}</span>{/if}
										{#if item.partner}<span class="inline-flex min-w-0 items-center gap-1"><MapPin class="size-3.5 shrink-0" /><span class="truncate">{item.partner}</span></span>{/if}
									</span>
								{/if}
								<span class="mt-2 block text-balance font-display text-[19px] font-semibold leading-snug tracking-[-0.02em] text-ink group-hover:text-program">{item.title}</span>
								{#if item.body}<span class="mt-2 line-clamp-3 text-[14px] leading-relaxed text-ink-soft">{item.body}</span>{/if}
								{#if item.beneficiaries}
									<span class="mt-auto inline-flex w-fit items-center gap-1.5 pt-4 text-[13px] font-medium text-ink"><Users class="size-4 text-program" />{item.beneficiaries}</span>
								{/if}
							</span>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>

<Dialog.Root open={open !== null} onOpenChange={(value) => !value && (open = null)}>
	<Dialog.Content
		class="max-h-[96dvh] max-w-[min(96vw,60rem)] gap-0 overflow-y-auto rounded-none border-none bg-paper p-0 sm:max-w-[min(96vw,60rem)] xl:max-w-[min(94vw,80rem)]"
		showCloseButton={false}
		onkeydown={(event: KeyboardEvent) => {
			if (event.key === 'ArrowRight') step(1);
			if (event.key === 'ArrowLeft') step(-1);
		}}
	>
		{#if current}
			<!-- One block, so the dialog's grid cannot squeeze the media frame below its 16:9 height. -->
			<div>
			{#if slide}
				<!-- One stage for the video and the photos, so moving between them keeps the same frame. -->
				<div class="relative aspect-video max-h-[72dvh] w-full overflow-hidden bg-black">
					{#if slide.kind === 'video'}
						{#key slide.src}
							<iframe src={slide.src} title={`${current.title} video`} class="absolute inset-0 h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>
						{/key}
					{:else}
						<img src={imageSrc(slide.src, 2400)} alt={`${current.title}, photo ${photo + 1}`} class="absolute inset-0 h-full w-full object-contain" />
					{/if}
					{#if slides.length > 1}
						<button type="button" onclick={() => step(-1)} class="absolute left-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center bg-ink/70 text-paper hover:bg-ink" aria-label="Previous"><ChevronLeft class="size-5" /></button>
						<button type="button" onclick={() => step(1)} class="absolute right-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center bg-ink/70 text-paper hover:bg-ink" aria-label="Next"><ChevronRight class="size-5" /></button>
						<span class="pointer-events-none absolute left-2 top-2 bg-ink/75 px-2 py-1 font-mono text-[11px] text-paper">{slide.kind === 'video' ? 'Video · ' : ''}{photo + 1} / {slides.length}</span>
					{/if}
				</div>
			{/if}
			<div class="relative p-6 sm:p-8">
				<Dialog.Close class="absolute right-3 top-3 grid size-9 place-items-center text-ink-soft hover:bg-salt hover:text-ink" aria-label="Close"><X class="size-5" /></Dialog.Close>
				{#if current.date || current.partner}
					<p class="flex flex-wrap gap-x-4 gap-y-1 pr-10 font-mono text-[11px] uppercase tracking-[0.04em] text-program">
						{#if current.date}<span class="inline-flex items-center gap-1"><CalendarDays class="size-3.5" />{current.date}</span>{/if}
						{#if current.partner}<span class="inline-flex items-center gap-1"><MapPin class="size-3.5" />{current.partner}</span>{/if}
					</p>
				{/if}
				<Dialog.Title class="mt-2 pr-10 text-balance font-display text-[clamp(1.4rem,3vw,2rem)] font-semibold leading-tight tracking-[-0.03em] text-ink">{current.title}</Dialog.Title>
				<Dialog.Description class="sr-only">Extension project details</Dialog.Description>
				{#if current.beneficiaries}<p class="mt-3 inline-flex items-center gap-1.5 text-[14px] font-medium text-ink"><Users class="size-4 text-program" />{current.beneficiaries}</p>{/if}
				{#if current.body}<div class="mt-4 max-w-[68ch] space-y-4 text-[15px] leading-relaxed text-ink-soft"><RichText text={current.body} /></div>{/if}
				{#if current.href}
					<a href={current.href} target={external(current.href) ? '_blank' : undefined} rel={external(current.href) ? 'noopener noreferrer' : undefined} class="mt-6 inline-flex h-11 items-center gap-2 bg-program px-5 text-[14px] font-semibold text-program-contrast hover:opacity-90">
						Open the documents <ArrowUpRight class="size-4" />
					</a>
				{/if}
			</div>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
