<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$lib/admin-enhance';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import CarouselEditor from '$lib/components/admin/carousel-editor.svelte';
	import ContentPreview from '$lib/components/admin/content-preview.svelte';
	import StatusBadge from '$lib/components/admin/status-badge.svelte';
	import { formatDate } from '$lib/format';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let value = $state('');
	let saveState = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
	let previewOpen = $state(false);
	let previewVersion = $state(0);
	let saveTimer: ReturnType<typeof setTimeout> | undefined;

	const canEdit = $derived(data.staff?.role === 'admin' || data.staff?.role === 'focal');
	const isJson = $derived(data.block.type === 'json');
	const isCarousel = $derived(data.block.key === 'home.carousel');

	$effect(() => {
		value = form?.value ?? data.block.draft_value ?? data.block.published_value ?? '';
	});

	onMount(() => () => clearTimeout(saveTimer));

	function scheduleSave() {
		if (!canEdit) return;
		saveState = 'idle';
		clearTimeout(saveTimer);
		saveTimer = setTimeout(saveDraft, 900);
	}

	async function saveDraft() {
		saveState = 'saving';

		try {
			const response = await fetch(`/admin/content/${data.block.id}/autosave`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ value })
			});

			if (!response.ok) {
				throw new Error('Autosave failed');
			}

			saveState = 'saved';
			previewVersion += 1;
		} catch {
			saveState = 'error';
		}
	}

</script>

<svelte:head>
	<title>{data.block.label} · AACCUP Admin</title>
</svelte:head>

<a href="/admin/content" class="inline-flex min-h-9 items-center gap-2 text-[13px] text-ink-soft hover:text-ink">
	<ArrowLeft class="size-3.5" />
	All content
</a>

<div class="mt-6 flex flex-col gap-4 border-b border-rule pb-6 sm:flex-row sm:items-end sm:justify-between">
	<div>
		<p class="font-mono text-[12px] text-ink-soft">{data.block.group_name} · {data.block.type}</p>
		<h1 class="mt-3 font-display text-[clamp(1.8rem,3.6vw,2.8rem)] font-semibold leading-[0.98] tracking-[-0.05em]">
			{data.block.label}
		</h1>
		<p class="mt-2 font-mono text-[12px] text-ink-soft">{data.block.key}</p>
	</div>
	<div class="text-left sm:text-right">
		<StatusBadge status={data.block.status} />
		<p class="mt-2 text-[12px] text-ink-soft">Updated {formatDate(data.block.updated_at?.slice(0, 10))}</p>
		<button
			type="button"
			onclick={() => (previewOpen = true)}
			class="mt-3 inline-flex items-center gap-1.5 border-b border-ink pb-0.5 text-[13px] font-medium text-ink"
		>
			Preview home
			<ArrowUpRight class="size-3.5" />
		</button>
	</div>
</div>


{#if !canEdit}
	<div class="mt-5 border border-dashed border-ink/25 bg-paper p-4 text-[13px] leading-relaxed text-ink-soft">
		Your role can view this block but not edit it. Ask the focal person or MIS admin to make the change.
	</div>
{/if}

<form method="POST" class="mt-7" onsubmit={() => clearTimeout(saveTimer)} use:enhance={() => async ({ update }) => update({ reset: false })}>
	<div class="grid gap-8 lg:grid-cols-[1fr_1.05fr]">
		<div>
			<label for="value" class="mb-2 block text-[13px] font-medium text-ink-soft">Draft value</label>
			{#if isCarousel}
				<CarouselEditor bind:value onchange={scheduleSave} disabled={!canEdit} />
				<textarea name="value" bind:value class="hidden" aria-hidden="true"></textarea>
			{:else if isJson}
				<textarea
					id="value"
					name="value"
					bind:value
					oninput={scheduleSave}
					rows="18"
					disabled={!canEdit}
					class="w-full resize-y border border-rule bg-paper p-4 font-mono text-[13px] leading-relaxed text-ink outline-none focus:border-ink disabled:opacity-60"
					spellcheck="false"
				></textarea>
			{:else if data.block.type === 'textarea'}
				<textarea
					id="value"
					name="value"
					bind:value
					oninput={scheduleSave}
					rows="10"
					disabled={!canEdit}
					class="w-full resize-y border border-rule bg-paper p-4 text-[13px] leading-relaxed text-ink outline-none focus:border-ink disabled:opacity-60"
				></textarea>
			{:else}
				<Input
					id="value"
					name="value"
					bind:value
					oninput={scheduleSave}
					disabled={!canEdit}
					class="h-11 rounded-none border-rule bg-paper text-[13px]"
				/>
			{/if}

			{#if isJson && !isCarousel}
				<p class="mt-2 text-[13px] leading-relaxed text-ink-soft">
					JSON value. Keep the brackets and quotes balanced.
				</p>
			{/if}

			{#if canEdit}
				<div class="mt-5 flex flex-wrap gap-2">
					<Button type="submit" formaction="?/save" variant="outline" class="h-10 rounded-none border-rule text-[13px]">
						Save draft
					</Button>
					<Button type="submit" formaction="?/submit" variant="outline" class="h-10 rounded-none border-rule text-[13px]">
						Submit for review
					</Button>
					<Button type="submit" formaction="?/publish" class="h-10 rounded-none bg-ink px-5 text-[13px] text-paper hover:bg-ink-soft">
						Publish
					</Button>
				</div>
				<div class="mt-3 flex flex-wrap items-center gap-3 text-[12px] leading-relaxed text-ink-soft">
					<span>
						Saving updates the draft only. Publish copies the draft to the live value.
					</span>
					<span class="font-mono" aria-live="polite">
						{#if saveState === 'saving'}
							Saving…
						{:else if saveState === 'saved'}
							Draft autosaved
						{:else if saveState === 'error'}
							Autosave failed
						{:else}
							Autosave on
						{/if}
					</span>
				</div>
			{/if}
		</div>

		<div>
			<ContentPreview
				blockKey={data.block.key}
				label={data.block.label}
				type={data.block.type}
				value={value}
			/>

			<details class="mt-4 border border-rule bg-paper">
				<summary class="cursor-pointer px-4 py-3 font-mono text-[12px] text-ink-soft [&::-webkit-details-marker]:hidden">
					Published value
				</summary>
				{#if data.block.published_value}
					<pre class="max-h-72 overflow-auto border-t border-rule px-4 py-3 whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-ink-soft">{data.block.published_value}</pre>
				{:else}
					<p class="border-t border-rule px-4 py-3 text-[13px] text-ink-soft">Not published yet.</p>
				{/if}
			</details>
		</div>
	</div>
</form>

<Dialog.Root bind:open={previewOpen}>
	<Dialog.Content class="max-w-[min(96vw,84rem)] gap-0 p-0 sm:max-w-[min(96vw,84rem)]">
		<div class="flex items-center justify-between gap-4 border-b border-rule p-4">
			<div>
				<Dialog.Title class="font-display text-[18px] font-semibold tracking-[-0.03em]">
					Home preview
				</Dialog.Title>
				<Dialog.Description class="mt-1 text-[13px] text-ink-soft">
					Draft content · last autosaved value
				</Dialog.Description>
			</div>
			<a
				href="/?preview=1"
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-1.5 border-b border-ink pb-0.5 text-[13px] font-medium text-ink"
			>
				Open in new tab
				<ArrowUpRight class="size-3.5" />
			</a>
		</div>
		<iframe
			src={`/?preview=1&v=${previewVersion}`}
			title="Full-page home preview"
			class="h-[75vh] w-full bg-salt"
		></iframe>
	</Dialog.Content>
</Dialog.Root>
