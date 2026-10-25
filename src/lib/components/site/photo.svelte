<script lang="ts">
	import ImageIcon from '@lucide/svelte/icons/image';
	import { imageSrc } from '#lib/image-url.js';
	import { photo } from '#lib/motion.js';

	// A photo that arrives quietly: skeleton tone and an image icon, then the photo sharpens in (styles in app.css).
	let {
		src,
		alt = '',
		width = 1200,
		class: className = '',
		imgClass = '',
		iconClass = 'size-6',
		loading = 'lazy'
	}: {
		src: string;
		alt?: string;
		width?: number;
		/** The frame: size, aspect ratio, and layout. */
		class?: string;
		imgClass?: string;
		iconClass?: string;
		loading?: 'lazy' | 'eager';
	} = $props();
</script>

<span class="photo-frame block {className}">
	<span class="photo-icon" aria-hidden="true"><ImageIcon class={iconClass} /></span>
	<img src={imageSrc(src, width)} {alt} {loading} class="h-full w-full object-cover {imgClass}" use:photo />
</span>
