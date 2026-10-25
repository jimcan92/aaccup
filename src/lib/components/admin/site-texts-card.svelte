<script lang="ts">
	import { enhance } from '#lib/admin-enhance.js';
	import ImageField from '#lib/components/admin/blocks/image-field.svelte';
	import StatusBadge from '#lib/components/admin/status-badge.svelte';

	type Text = { id: string; key: string; draft_value: string | null; published_value: string | null; status: string };

	// The home page heading and intro, plus the site title, description and footer line (content_blocks).
	let { texts, canManage }: { texts: Text[]; canManage: boolean } = $props();

	const fields = [
		{ key: 'home.hero.title', label: 'Heading', hint: 'The large title at the top of the home page.', rows: 1 },
		{ key: 'home.hero.intro', label: 'Intro', hint: 'One or two lines under the heading. Leave empty to hide.', rows: 2 },
		{ key: 'home.hero.image', label: 'Hero photo', hint: 'A wide campus photo behind the heading, under a dark tint. Leave empty for the plain header.', rows: 0 },
		{ key: 'site.title', label: 'Site title', hint: 'The browser tab and search results.', rows: 1 },
		{ key: 'site.description', label: 'Description', hint: 'Search results and link previews.', rows: 2 },
		{ key: 'site.contact_note', label: 'Footer contact line', hint: 'At the bottom of every page, program pages included.', rows: 2 }
	] as const;

	const byKey = $derived(Object.fromEntries(texts.map((text) => [text.key, text])));
	// svelte-ignore state_referenced_locally
	let heroImage = $state(texts.find((text) => text.key === 'home.hero.image')?.draft_value ?? '');
	const pending = $derived(texts.filter((text) => text.draft_value !== text.published_value).length);

	const input = 'w-full border border-rule bg-salt px-3 py-2.5 text-[14px] leading-relaxed text-ink outline-none focus:border-ink disabled:opacity-60';
</script>

<section id="site-texts" class="scroll-mt-24 border border-rule bg-paper" aria-labelledby="site-texts-heading">
	<header class="flex flex-wrap items-center gap-2 border-b border-rule px-4 py-3">
		<h2 id="site-texts-heading" class="font-display text-[17px] font-semibold tracking-[-0.02em]">Page header & site texts</h2>
		<span class="text-[12px] text-ink-soft">{pending ? `${pending} with unpublished changes` : 'All live'}</span>
	</header>
	<form method="POST" action="?/saveTexts" use:enhance={() => async ({ update }) => update({ reset: false })} class="grid gap-4 p-4">
		<fieldset disabled={!canManage} class="grid gap-4 md:grid-cols-2">
			{#each fields as field (field.key)}
				{@const text = byKey[field.key]}
				{#if text}
					{#if field.rows === 0}
						<div class="grid content-start gap-1.5 text-[13px] font-medium md:col-span-2">
							<span class="flex items-center gap-2">{field.label}{#if text.draft_value !== text.published_value}<StatusBadge status="draft" />{/if}</span>
							<ImageField bind:value={heroImage} programId="site" label={field.label} />
							<input type="hidden" name={field.key} value={heroImage} />
							<span class="text-[12px] font-normal text-ink-soft">{field.hint}</span>
						</div>
					{:else}
					<label class="grid content-start gap-1.5 text-[13px] font-medium {field.rows > 1 ? 'md:col-span-2' : ''}">
						<span class="flex items-center gap-2">{field.label}{#if text.draft_value !== text.published_value}<StatusBadge status="draft" />{/if}</span>
						{#if field.rows > 1}
							<textarea name={field.key} rows={field.rows} class={input}>{text.draft_value ?? ''}</textarea>
						{:else}
							<input name={field.key} value={text.draft_value ?? ''} class={input} />
						{/if}
						<span class="text-[12px] font-normal text-ink-soft">{field.hint}</span>
					</label>
					{/if}
				{/if}
			{/each}
		</fieldset>
		{#if canManage}
			<div class="flex flex-wrap items-center gap-2 border-t border-rule pt-4">
				<button class="h-10 bg-ink px-4 text-[13px] font-medium text-paper hover:bg-ink-soft">Save drafts</button>
				<button formaction="?/publishTexts" class="h-10 border border-ink px-4 text-[13px] font-medium hover:bg-ink hover:text-paper">Publish</button>
				<span class="text-[12px] text-ink-soft">Publish also saves. The public pages update within a minute.</span>
			</div>
		{:else}
			<p class="text-[12px] text-ink-soft">Only admins and focal persons edit these.</p>
		{/if}
	</form>
</section>
