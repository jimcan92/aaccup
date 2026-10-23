<script lang="ts">
	import { videoEmbed, type VideoContent } from '#lib/landing.js';
	import { field, hint, label } from './ui';

	let { value = $bindable() }: { value: VideoContent } = $props();

	const embed = $derived(videoEmbed(value.url));
</script>

<div class="grid gap-4">
	<label class={label}>
		Video link
		<input bind:value={value.url} placeholder="https://www.youtube.com/watch?v=… or a Google Drive video link" class="{field} font-mono text-[12px]" />
	</label>
	{#if value.url && !embed}
		<p class="text-[12px] text-destructive">This link can't be played here. Use a YouTube link or a Google Drive video link.</p>
	{:else if embed}
		<div class="aspect-video w-full max-w-md bg-ink"><iframe src={embed} title="Video preview" loading="lazy" allowfullscreen class="h-full w-full border-0"></iframe></div>
	{:else}
		<p class={hint}>The video shows on the page once it has a link. Drive videos must be shared as “Anyone with the link”.</p>
	{/if}
	<label class={label}>Caption (optional)<input bind:value={value.caption} class={field} /></label>
</div>
