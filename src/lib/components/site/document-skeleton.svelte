<script lang="ts">
	import { fade } from 'svelte/transition';
	import { Skeleton } from '#lib/components/ui/skeleton/index.js';

	// Stands in for a Drive preview while its frame loads: a page with a title, lines, and a figure.
	let { label = 'Loading preview' }: { label?: string } = $props();
</script>

<div class="absolute inset-0 overflow-hidden bg-paper p-6 sm:p-10" role="status" aria-live="polite" out:fade|global={{ duration: 250 }}>
	<span class="sr-only">{label}</span>
	<div class="mx-auto max-w-2xl space-y-6">
		<Skeleton class="h-7 w-2/3" />
		<div class="space-y-2.5">
			<Skeleton class="h-3 w-full" />
			<Skeleton class="h-3 w-[94%]" />
			<Skeleton class="h-3 w-[88%]" />
			<Skeleton class="h-3 w-3/5" />
		</div>
		<Skeleton class="h-40 w-full" />
		<div class="space-y-2.5">
			<Skeleton class="h-3 w-full" />
			<Skeleton class="h-3 w-[90%]" />
			<Skeleton class="h-3 w-4/5" />
		</div>
	</div>
</div>
