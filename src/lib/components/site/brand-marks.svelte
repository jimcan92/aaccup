<script lang="ts">
	import aaccupLarge from '#lib/images/aaccup-logo-288.webp';
	import aaccupSmall from '#lib/images/aaccup-logo-96.webp';
	import ctuLarge from '#lib/images/ctu-seal-288.webp';
	import ctuSmall from '#lib/images/ctu-seal-96.webp';
	import { cn } from '#lib/utils.js';

	let {
		size = 36,
		decorative = true,
		class: className = ''
	}: {
		/** Rendered diameter of each mark in CSS pixels. */
		size?: number;
		/** True when a surrounding link or heading already names the site. */
		decorative?: boolean;
		class?: string;
	} = $props();

	// 96px covers up to 48px at 2x; larger marks use the 288px files.
	const large = $derived(size > 48);
</script>

<span class={cn('inline-flex shrink-0 items-center', className)}>
	<img
		src={large ? ctuLarge : ctuSmall}
		alt={decorative ? '' : 'Cebu Technological University seal'}
		width={size}
		height={size}
		class="rounded-full"
		decoding="async"
	/>
	<!-- Same as the favicon: AACCUP on top, its edge at the centre of the CTU seal. -->
	<img
		src={large ? aaccupLarge : aaccupSmall}
		alt={decorative ? '' : 'AACCUP logo'}
		width={size}
		height={size}
		class="relative z-10 rounded-full"
		style:margin-left={`${-size * 0.5}px`}
		decoding="async"
	/>
</span>
