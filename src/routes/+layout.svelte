<script lang="ts">
	import { page } from '$app/state';
	import { ModeWatcher } from 'mode-watcher';
	import NavProgress from '#lib/components/site/nav-progress.svelte';
	import SiteHeader from '#lib/components/site/site-header.svelte';
	import { forcedTheme } from '#lib/preview-theme.svelte.js';
	import '../app.css';

	let { children } = $props();
	const isAdmin = $derived(page.url.pathname.startsWith('/admin'));

	// The admin's page previews ask for a theme (?theme=dark). That page shows it without the
	// theme switcher's stored choice, so previewing never changes the visitor's own theme.
	const forced = $derived(forcedTheme(page.url.searchParams));

	// The admin keeps plain backgrounds, without the public pages' graph-paper texture (app.css).
	$effect(() => {
		document.documentElement.classList.toggle('in-admin', isAdmin);
	});
	$effect(() => {
		if (!forced) return;
		document.documentElement.classList.toggle('dark', forced === 'dark');
		document.documentElement.style.colorScheme = forced;
	});
</script>

<NavProgress />

<!-- Light, dark or system, chosen with the theme switcher (remembered per browser); the admin follows it too. -->
{#if !forced}<ModeWatcher defaultMode="system" />{/if}

{#if isAdmin}
	{@render children()}
{:else}
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
