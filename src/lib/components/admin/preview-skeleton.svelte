<script lang="ts">
	import { fade } from 'svelte/transition';
	import { Skeleton } from '#lib/components/ui/skeleton/index.js';

	// Stands in for the page preview while its frame loads: a hero, then a block of text.
</script>

<div class="absolute inset-0 z-10 space-y-6 overflow-hidden bg-salt p-5" role="status" aria-live="polite" out:fade={{ duration: 250 }}>
	<span class="sr-only">Loading preview</span>
	<div class="skeleton flex h-[45%] min-h-40 flex-col justify-end gap-3 p-6">
		<Skeleton class="h-8 w-1/2 bg-ink/10" />
		<Skeleton class="h-3 w-2/3 bg-ink/10" />
	</div>
	<div class="grid grid-cols-2 gap-4">
		<Skeleton class="h-28" />
		<Skeleton class="h-28" />
	</div>
	<div class="space-y-2.5">
		<Skeleton class="h-5 w-1/3" />
		<Skeleton class="h-3 w-full" />
		<Skeleton class="h-3 w-[90%]" />
		<Skeleton class="h-3 w-4/5" />
	</div>
</div>
