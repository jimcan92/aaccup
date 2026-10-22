<script lang="ts">
	import ProgramLanding from '$lib/components/program/program-landing.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<ProgramLanding program={data.program} visit={data.visit} blocks={data.blocks} />
