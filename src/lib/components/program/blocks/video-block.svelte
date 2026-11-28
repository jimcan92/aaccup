<script lang="ts">
	import { videoEmbed, videoFile, type VideoContent } from '#lib/landing.js';
	import Section from './section.svelte';

	let { content, tone }: { content: VideoContent; tone: 'paper' | 'salt' } = $props();

	const file = $derived(videoFile(content.url));
	// YouTube autoplays only when muted; the lazy iframe loads as it nears the screen.
	const embed = $derived.by(() => {
		const src = videoEmbed(content.url);
		return src && content.autoplay && src.includes('youtube') ? `${src}?autoplay=1&mute=1&playsinline=1` : src;
	});

	/** Play muted while at least half the video is on screen, pause when it leaves; stop once the viewer pauses it themselves. */
	function autoplay(video: HTMLVideoElement) {
		let ours = false;
		let stopped = false;
		const onPause = () => {
			if (!ours) stopped = true;
			ours = false;
		};
		video.addEventListener('pause', onPause);
		const observer = new IntersectionObserver(
			([entry]) => {
				if (stopped) return;
				if (entry.isIntersecting) video.play().catch(() => {});
				else if (!video.paused) {
					ours = true;
					video.pause();
				}
			},
			{ threshold: 0.5 }
		);
		observer.observe(video);
		return () => {
			observer.disconnect();
			video.removeEventListener('pause', onPause);
		};
	}
</script>

{#if file || embed}
	<Section title={content.title} {tone}>
		<figure>
			<div class="aspect-video w-full bg-ink">
				{#if file}
					{#if content.autoplay}
						<video src={file} controls muted loop playsinline preload="metadata" class="h-full w-full" {@attach autoplay}></video>
					{:else}
						<!-- svelte-ignore a11y_media_has_caption (uploaded videos have no caption files; the caption below describes it) -->
						<video src={file} controls playsinline preload="metadata" class="h-full w-full"></video>
					{/if}
				{:else}
					<iframe
						src={embed}
						title={content.title || content.caption || 'Video'}
						loading="lazy"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
						referrerpolicy="strict-origin-when-cross-origin"
						allowfullscreen
						class="h-full w-full border-0"
					></iframe>
				{/if}
			</div>
			{#if content.caption}<figcaption class="mt-3 text-[14px] text-ink-soft">{content.caption}</figcaption>{/if}
		</figure>
	</Section>
{/if}
