<script lang="ts">
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import X from '@lucide/svelte/icons/x';
	import { browser } from '$app/environment';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { sectionLabel } from '$lib/data/accreditation';
	import type { Visit } from '$lib/data/types';
	import { kindLabel } from '$lib/format';
	import { isLinked } from '$lib/drive-url';
	import { closePreview, currentPreviewId, previewUrl, switchPreview, wideScreen } from '$lib/preview';

	let { visit, style }: { visit: Visit; style: string } = $props();

	// ?doc= is read only in the browser, so the cached server HTML is the same for everyone.
	// On wide screens the row expands in place instead (see document-row.svelte).
	const id = $derived(browser && !wideScreen.current ? currentPreviewId() : null);

	const found = $derived.by(() => {
		if (!id) return null;
		for (const section of visit.sections) {
			const siblings = section.documents.filter(isLinked);
			const index = siblings.findIndex((document) => document.id === id);
			if (index !== -1) return { section, document: siblings[index], previous: siblings[index - 1], next: siblings[index + 1], index, count: siblings.length };
		}
		return null;
	});

	const embed = $derived(previewUrl(found?.document.driveUrl));
	let loading = $state(true);

	$effect(() => {
		// A new document starts loading again.
		void embed;
		loading = true;
	});

	function onKeydown(event: KeyboardEvent) {
		if (!found || event.altKey || event.ctrlKey || event.metaKey) return;
		const target = event.target as HTMLElement | null;
		if (target?.closest('input, textarea, select')) return;
		if (event.key === 'ArrowLeft' && found.previous) switchPreview(found.previous.id);
		if (event.key === 'ArrowRight' && found.next) switchPreview(found.next.id);
	}
</script>

<svelte:window onkeydown={onKeydown} />

<Sheet.Root open={found !== null} onOpenChange={(open) => !open && closePreview()}>
	<Sheet.Content
		side="right"
		showCloseButton={false}
		class="program-scope w-full! max-w-none! gap-0 border-l border-rule bg-salt p-0 md:w-[min(64rem,78vw)]!"
		{style}
	>
		{#if found}
			<header class="on-program flex items-center gap-2 bg-program px-3 py-2.5 text-program-contrast sm:px-4">
				<div class="min-w-0 flex-1">
					<Sheet.Title class="truncate font-display text-[16px] font-semibold tracking-[-0.02em] text-program-contrast sm:text-[17px]">
						{found.document.title}
					</Sheet.Title>
					<Sheet.Description class="truncate text-[12px] text-program-contrast/80">
						{sectionLabel(found.section)} · {kindLabel(found.document.kind)} · {found.index + 1} of {found.count}
					</Sheet.Description>
				</div>

				<div class="flex shrink-0 items-center gap-1">
					<button
						type="button"
						onclick={() => found?.previous && switchPreview(found.previous.id)}
						disabled={!found.previous}
						class="grid size-9 place-items-center transition-colors hover:bg-program-contrast/10 disabled:opacity-35"
						aria-label="Previous document"
					>
						<ChevronLeft class="size-5" />
					</button>
					<button
						type="button"
						onclick={() => found?.next && switchPreview(found.next.id)}
						disabled={!found.next}
						class="grid size-9 place-items-center transition-colors hover:bg-program-contrast/10 disabled:opacity-35"
						aria-label="Next document"
					>
						<ChevronRight class="size-5" />
					</button>
					<a
						href={found.document.driveUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="ml-1 inline-flex h-9 items-center gap-1.5 border border-program-contrast/35 px-2.5 text-[13px] font-medium transition-colors hover:bg-program-contrast/10 sm:px-3"
					>
						<ExternalLink class="size-4" />
						<span class="hidden sm:inline">Open in Drive</span>
						<span class="sr-only sm:hidden">Open in Drive (new tab)</span>
					</a>
					<Sheet.Close class="grid size-9 place-items-center transition-colors hover:bg-program-contrast/10" aria-label="Close preview">
						<X class="size-5" />
					</Sheet.Close>
				</div>
			</header>

			<div class="relative min-h-0 flex-1 bg-paper">
				{#if embed}
					{#key embed}
						{#if loading}
							<p class="absolute inset-0 grid place-items-center text-[13px] text-ink-soft" aria-live="polite">Loading preview…</p>
						{/if}
						<iframe
							src={embed}
							title={`Preview: ${found.document.title}`}
							class="relative h-full w-full border-0"
							onload={() => (loading = false)}
							allow="autoplay; fullscreen"
							referrerpolicy="no-referrer"
						></iframe>
					{/key}
				{:else}
					<div class="grid h-full place-items-center p-8 text-center">
						<div class="max-w-sm">
							<p class="font-display text-[20px] font-semibold tracking-[-0.03em] text-ink">This record opens on its own page.</p>
							<p class="mt-2 text-[14px] leading-relaxed text-ink-soft">It is not a Google Drive file, so it cannot be shown here.</p>
							<a
								href={found.document.driveUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="on-program mt-5 inline-flex h-10 items-center gap-2 bg-program px-4 text-[13px] font-medium text-program-contrast"
							>
								Open in a new tab
								<ArrowUpRight class="size-4" />
							</a>
						</div>
					</div>
				{/if}
			</div>

			<p class="border-t border-rule bg-salt px-4 py-2 text-[12px] text-ink-soft">
				If the preview asks for access, the file is not shared as “Anyone with the link”. Use Open in Drive or contact the task force.
			</p>
		{/if}
	</Sheet.Content>
</Sheet.Root>
