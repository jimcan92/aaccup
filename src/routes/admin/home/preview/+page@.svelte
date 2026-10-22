<script lang="ts">
	// Rendered without the admin chrome (@ resets to the root layout): it fills the editor's preview frame.
	import { onMount } from 'svelte';
	import Home from '../../../+page.svelte';
	import { connectPreview } from '$lib/block-preview';
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

<Home data={{ ...data.home, blocks, drafts, editable: true } as never} params={{} as never} form={null as never} />
