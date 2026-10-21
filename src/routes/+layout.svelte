<script lang="ts">
	import '../app.css';
	import SiteFooter from '$lib/components/site/site-footer.svelte';
	import SiteHeader from '$lib/components/site/site-header.svelte';

	let { children } = $props();
</script>

<a
	href="#main"
	class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-paper"
>
	Skip to content
</a>

<SiteHeader />

<main id="main" class="min-h-[60vh]">
	{@render children()}
</main>

<SiteFooter />
