<script lang="ts">
	// Rendered without the admin chrome (@ resets to the root layout): it fills the editor's preview frame.
	import { onMount } from 'svelte';
	import ProgramLanding from '#lib/components/program/program-landing.svelte';
	import { connectPreview } from '#lib/block-preview.js';
	import { themeStyle } from '#lib/theme.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// svelte-ignore state_referenced_locally
	let blocks = $state(data.blocks);
	// svelte-ignore state_referenced_locally
	let drafts = $state(data.drafts);
	// The details form sends its unsaved fields here too.
	// svelte-ignore state_referenced_locally
	let program = $state(data.program);

	onMount(() =>
		connectPreview(
			(next, nextDrafts) => ((blocks = next), (drafts = nextDrafts)),
			(patch) => (program = { ...program, ...patch })
		)
	);
</script>

<svelte:head>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="program-scope min-h-dvh bg-salt" style={themeStyle(program.theme)}>
	<ProgramLanding {program} visit={data.visit} {blocks} {drafts} editable />
</div>
