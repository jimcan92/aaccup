<script lang="ts">
	// Rendered without the admin chrome (@ resets to the root layout): it fills the editor's preview frame.
	import { onMount } from 'svelte';
	import ProgramLanding from '$lib/components/program/program-landing.svelte';
	import { connectPreview } from '$lib/block-preview';
	import { themeStyle } from '$lib/theme';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// svelte-ignore state_referenced_locally
	let blocks = $state(data.blocks);
	// svelte-ignore state_referenced_locally
	let drafts = $state(data.drafts);

	onMount(() => connectPreview((next, nextDrafts) => ((blocks = next), (drafts = nextDrafts))));
</script>

<svelte:head>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="program-scope min-h-dvh bg-salt" style={themeStyle(data.program.theme)}>
	<ProgramLanding program={data.program} visit={data.visit} {blocks} {drafts} editable />
</div>
