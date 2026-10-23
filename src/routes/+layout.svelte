<script lang="ts">
	import { page } from '$app/state';
	import { ModeWatcher } from 'mode-watcher';
	import SiteHeader from '$lib/components/site/site-header.svelte';
	import '../app.css';

	let { children } = $props();
	const isAdmin = $derived(page.url.pathname.startsWith('/admin'));

	// The admin keeps the light palette even when the visitor chose dark on the public site
	// (dialogs and sheets render outside the admin layout, so the class goes on <html>).
	$effect(() => {
		document.documentElement.classList.toggle('admin-light', isAdmin);
	});
</script>

{#if isAdmin}
	{@render children()}
{:else}
	<!-- Light, dark or system, chosen with the theme switcher in the header (remembered per browser). -->
	<ModeWatcher defaultMode="system" />

	<a
		href="#main"
		class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-paper"
	>
		Skip to content
	</a>

	<!-- One header for every public page; it shows the program on program pages. -->
	<SiteHeader />

	<div class="flex min-h-dvh flex-col">
		{@render children()}
	</div>
{/if}
