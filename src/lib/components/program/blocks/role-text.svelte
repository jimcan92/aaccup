<script lang="ts">
	import { tick } from 'svelte';

	// A long role is cut to one or two lines; clicking it opens the rest with a short height animation.
	let { text, lines = 2, class: className = '' }: { text: string; lines?: 1 | 2; class?: string } = $props();
	const clamp = $derived(lines === 1 ? 'line-clamp-1' : 'line-clamp-2');

	let el = $state<HTMLElement>();
	let open = $state(false);
	let long = $state(false);

	// Only a role that does not fit gets the toggle. The element never changes,
	// so measuring cannot flip what is rendered.
	$effect(() => {
		void text;
		const cut = clamp;
		const node = el;
		if (!node) return;
		const measure = () => {
			if (!node.classList.contains(cut)) return;
			long = node.scrollHeight > node.clientHeight + 1;
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(node);
		return () => observer.disconnect();
	});

	async function toggle(event: MouseEvent) {
		event.stopPropagation();
		if (!el || !long) return;
		const from = el.offsetHeight;
		open = !open;
		await tick();
		const to = el.offsetHeight;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		el.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: 220, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
	}
</script>

<!-- Not long: the button lets clicks fall through to the card and stays out of the tab order. -->
<button
	type="button"
	onclick={toggle}
	tabindex={long ? 0 : -1}
	aria-expanded={long ? open : undefined}
	title={long ? (open ? 'Show less' : 'Show all designations') : undefined}
	class="w-full text-center {long ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
>
	<span bind:this={el} class="overflow-hidden {open ? 'block' : clamp} {className}">{text}</span>
</button>
