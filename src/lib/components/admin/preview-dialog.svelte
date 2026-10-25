<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import PreviewSkeleton from '#lib/components/admin/preview-skeleton.svelte';
	import * as Dialog from '#lib/components/ui/dialog/index.js';

	// The preview on narrow screens: a fullscreen dialog around the preview frame.
	let { src, hint, open = $bindable(false), frame = $bindable() }: { src: string; hint: string; open?: boolean; frame?: HTMLIFrameElement } = $props();

	let loading = $state(true);
	// A reopened frame loads again, so it gets the skeleton again.
	$effect(() => {
		if (!open) loading = true;
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="flex h-dvh max-h-dvh w-screen max-w-none flex-col gap-0 rounded-none border-none p-0 sm:max-w-none" showCloseButton={false}>
		<div class="flex items-center gap-3 border-b border-rule bg-paper px-4 py-3">
			<div class="mr-auto min-w-0">
				<Dialog.Title class="font-display text-[17px] font-semibold tracking-[-0.02em]">Preview</Dialog.Title>
				<Dialog.Description class="text-[12px] text-ink-soft">{hint}</Dialog.Description>
			</div>
			<Dialog.Close class="grid size-10 shrink-0 cursor-pointer place-items-center text-ink-soft hover:bg-salt hover:text-ink" aria-label="Close preview"><X class="size-5" /></Dialog.Close>
		</div>
		<div class="relative min-h-0 flex-1">
			{#if open}<iframe bind:this={frame} {src} title="Page preview" onload={() => (loading = false)} class="h-full w-full border-0 bg-salt"></iframe>{/if}
			{#if loading}<PreviewSkeleton />{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
