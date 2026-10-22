<script lang="ts">
	import SectionPage from '$lib/components/program/section-page.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<SectionPage {...data} />
