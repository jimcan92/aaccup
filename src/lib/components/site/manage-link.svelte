<script lang="ts">
	import Settings2 from '@lucide/svelte/icons/settings-2';
	import { onMount } from 'svelte';
	import { cn } from '$lib/utils';

	let { class: className = '', compact = false }: { class?: string; compact?: boolean } = $props();

	// Public pages are cached for everyone, so staff status is asked from the browser.
	let isStaff = $state(false);

	onMount(async () => {
		try {
			const response = await fetch('/admin/me', { credentials: 'same-origin' });
			isStaff = response.ok && Boolean((await response.json()).staff);
		} catch {
			isStaff = false;
		}
	});
</script>

{#if isStaff}
	<a href="/admin" class={cn('inline-flex h-9 items-center gap-2 px-3 text-[13px] font-medium transition-colors', className)}>
		<Settings2 class="size-4 shrink-0" />
		<span class={compact ? 'sr-only sm:not-sr-only' : ''}>Manage</span>
	</a>
{/if}
