<script lang="ts">
	import { videoEmbed, type VideoContent } from '$lib/landing';
	import Section from './section.svelte';

	let { content, tone }: { content: VideoContent; tone: 'paper' | 'salt' } = $props();

	const embed = $derived(videoEmbed(content.url));
</script>

{#if embed}
	<Section title={content.title} {tone}>
		<figure class="max-w-5xl">
			<div class="aspect-video w-full bg-ink">
				<iframe
					src={embed}
					title={content.title || content.caption || 'Video'}
					loading="lazy"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
					referrerpolicy="strict-origin-when-cross-origin"
					allowfullscreen
					class="h-full w-full border-0"
				></iframe>
			</div>
			{#if content.caption}<figcaption class="mt-3 text-[14px] text-ink-soft">{content.caption}</figcaption>{/if}
		</figure>
	</Section>
{/if}
