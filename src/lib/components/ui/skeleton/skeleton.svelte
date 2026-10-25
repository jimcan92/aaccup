<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '#lib/utils.js';

	// A placeholder block while something loads: square corners, a faint slow sweep (styles in app.css).
	let { class: className, ...restProps }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div data-slot="skeleton" aria-hidden="true" class={cn('skeleton rounded-none', className)} {...restProps}></div>
