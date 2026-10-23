<script lang="ts">
	import DocumentSearch from '#lib/components/program/document-search.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<DocumentSearch program={data.program} visit={data.visit} base={data.base} />
