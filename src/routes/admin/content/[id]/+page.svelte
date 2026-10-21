<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ContentPreview from '$lib/components/admin/content-preview.svelte';
	import { formatDate } from '$lib/format';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let value = $state('');

	const canEdit = $derived(data.profile?.role === 'admin' || data.profile?.role === 'focal');
	const isJson = $derived(data.block.type === 'json');

	$effect(() => {
		value = form?.value ?? data.block.draft_value ?? data.block.published_value ?? '';
	});
</script>

<svelte:head>
	<title>{data.block.label} · AACCUP Admin</title>
</svelte:head>

<a href="/admin/content" class="inline-flex items-center gap-2 text-[10px] text-ink-soft hover:text-ink">
	<ArrowLeft class="size-3.5" />
	All content
</a>

<div class="mt-6 flex flex-col gap-4 border-b border-rule pb-6 sm:flex-row sm:items-end sm:justify-between">
	<div>
		<p class="font-mono text-[9px] text-ink-soft">{data.block.group_name} · {data.block.type}</p>
		<h1 class="mt-3 font-display text-[clamp(1.8rem,3.6vw,2.8rem)] font-semibold leading-[0.98] tracking-[-0.05em]">
			{data.block.label}
		</h1>
		<p class="mt-2 font-mono text-[9px] text-ink-soft">{data.block.key}</p>
	</div>
	<div class="text-left sm:text-right">
		<span class="border border-rule px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em]">
			{data.block.status}
		</span>
		<p class="mt-2 text-[9px] text-ink-soft">Updated {formatDate(data.block.updated_at?.slice(0, 10))}</p>
	</div>
</div>

{#if form?.message}
	<div class="mt-5 border border-rule bg-paper p-4 text-[11px] leading-relaxed text-ink">
		{form.message}
	</div>
{/if}

{#if !canEdit}
	<div class="mt-5 border border-dashed border-ink/25 bg-paper p-4 text-[11px] leading-relaxed text-ink-soft">
		Your role can view this block but not edit it. Ask the focal person or MIS admin to make the change.
	</div>
{/if}

<form method="POST" class="mt-7">
	<div class="grid gap-8 lg:grid-cols-[1fr_1.05fr]">
		<div>
			<label for="value" class="mb-2 block text-[10px] font-medium text-ink-soft">Draft value</label>
			{#if isJson}
				<textarea
					id="value"
					name="value"
					bind:value
					rows="18"
					disabled={!canEdit}
					class="w-full resize-y border border-rule bg-paper p-4 font-mono text-[11px] leading-relaxed text-ink outline-none focus:border-ink disabled:opacity-60"
					spellcheck="false"
				></textarea>
			{:else if data.block.type === 'textarea'}
				<textarea
					id="value"
					name="value"
					bind:value
					rows="10"
					disabled={!canEdit}
					class="w-full resize-y border border-rule bg-paper p-4 text-[13px] leading-relaxed text-ink outline-none focus:border-ink disabled:opacity-60"
				></textarea>
			{:else}
				<Input
					id="value"
					name="value"
					bind:value
					disabled={!canEdit}
					class="h-11 rounded-none border-rule bg-paper text-[13px]"
				/>
			{/if}

			{#if isJson}
				<p class="mt-2 text-[10px] leading-relaxed text-ink-soft">
					JSON array for the carousel. Each slide needs <code class="font-mono">src</code>, <code class="font-mono">alt</code>, <code class="font-mono">caption</code>, and <code class="font-mono">meta</code>.
				</p>
			{/if}

			{#if canEdit}
				<div class="mt-5 flex flex-wrap gap-2">
					<Button type="submit" formaction="?/save" variant="outline" class="h-10 rounded-none border-rule text-[11px]">
						Save draft
					</Button>
					<Button type="submit" formaction="?/submit" variant="outline" class="h-10 rounded-none border-rule text-[11px]">
						Submit for review
					</Button>
					<Button type="submit" formaction="?/publish" class="h-10 rounded-none text-[11px]">
						Publish
					</Button>
				</div>
				<p class="mt-3 text-[9px] leading-relaxed text-ink-soft">
					Saving updates the draft only. Publish copies the draft to the live value.
				</p>
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
				<summary class="cursor-pointer px-4 py-3 font-mono text-[9px] text-ink-soft [&::-webkit-details-marker]:hidden">
					Published value
				</summary>
				{#if data.block.published_value}
					<pre class="max-h-72 overflow-auto border-t border-rule px-4 py-3 whitespace-pre-wrap break-words font-mono text-[10px] leading-relaxed text-ink-soft">{data.block.published_value}</pre>
				{:else}
					<p class="border-t border-rule px-4 py-3 text-[11px] text-ink-soft">Not published yet.</p>
				{/if}
			</details>
		</div>
	</div>
</form>
