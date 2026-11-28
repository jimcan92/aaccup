<script lang="ts">
	import { videoEmbed, videoFile, type VideoContent } from '#lib/landing.js';
	import { field, hint, label } from './ui';

	let { value = $bindable() }: { value: VideoContent } = $props();

	const embed = $derived(videoEmbed(value.url));
	const file = $derived(videoFile(value.url));
	const isDrive = $derived(Boolean(embed?.includes('drive.google.com')));
</script>

<div class="grid gap-4">
	<label class={label}>
		Video link
		<input bind:value={value.url} placeholder="https://www.youtube.com/watch?v=…, a Google Drive video link, or an .mp4 link" class="{field} font-mono text-[12px]" />
	</label>
	{#if value.url && !embed && !file}
		<p class="text-[12px] text-destructive">This link can't be played here. Use a YouTube link, a Google Drive video link, or a link to an .mp4 file.</p>
	{:else if file}
		<div class="admin-chrome aspect-video w-full max-w-md bg-ink"><video src={file} controls muted playsinline preload="metadata" class="h-full w-full"></video></div>
	{:else if embed}
		<div class="admin-chrome aspect-video w-full max-w-md bg-ink"><iframe src={embed} title="Video preview" loading="lazy" allowfullscreen class="h-full w-full border-0"></iframe></div>
	{:else}
		<p class={hint}>The video shows on the page once it has a link. Drive videos must be shared as “Anyone with the link”.</p>
	{/if}
	<label class="flex items-start gap-2 text-[13px]">
		<input type="checkbox" bind:checked={value.autoplay} class="mt-0.5" />
		<span>
			Play automatically, muted, when it scrolls into view
			<span class="block {hint}">{isDrive ? 'Drive’s player cannot autoplay: use a YouTube or .mp4 link for this.' : 'Browsers only autoplay muted video; viewers can turn the sound on.'}</span>
		</span>
	</label>
	<label class={label}>Caption (optional)<input bind:value={value.caption} class={field} /></label>
</div>
