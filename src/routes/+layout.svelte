<script lang="ts">
	import { page } from '$app/state';
	import '../app.css';

	let { children } = $props();
	const isAdmin = $derived(page.url.pathname.startsWith('/admin'));
</script>

{#if isAdmin}
	{@render children()}
{:else}
	<a
		href="#main"
		class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-paper"
	>
		Skip to content
	</a>

	<div class="flex min-h-dvh flex-col">
		{@render children()}
	</div>
{/if}
