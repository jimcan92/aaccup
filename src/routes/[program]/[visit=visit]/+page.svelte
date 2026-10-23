<script lang="ts">
	import VisitHome from '#lib/components/program/visit-home.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<VisitHome program={data.program} visit={data.visit} base={data.base} />
