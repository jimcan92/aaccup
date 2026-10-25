<script lang="ts">
	import { navigating } from '$app/state';
	import { untrack } from 'svelte';

	// A thin bar at the top while a page takes more than a moment to load; quick navigations show nothing.
	let phase = $state<'idle' | 'loading' | 'done'>('idle');

	$effect(() => {
		if (!navigating.to) {
			// untrack: only the navigation drives this effect, so setting the phase does not cancel the timer.
			if (untrack(() => phase) === 'loading') {
				phase = 'done';
				const timer = setTimeout(() => (phase = 'idle'), 400);
				return () => clearTimeout(timer);
			}
			return;
		}

		const timer = setTimeout(() => (phase = 'loading'), 150);
		return () => clearTimeout(timer);
	});
</script>

{#if phase !== 'idle'}
	<div class="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 print:hidden" role="progressbar" aria-label="Loading page" aria-busy={phase === 'loading'}>
		<div class="nav-progress h-full origin-left bg-program" data-state={phase}></div>
	</div>
{/if}
