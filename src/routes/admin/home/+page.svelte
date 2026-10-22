<script lang="ts">
	import LandingPageEditor from '$lib/components/admin/landing-page-editor.svelte';
	import PageHeader from '$lib/components/admin/page-header.svelte';
	import SiteTextsCard from '$lib/components/admin/site-texts-card.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Home page · AACCUP Desk</title>
</svelte:head>

<PageHeader
	eyebrow="Home page"
	title="The campus front page"
	description="The heading and site texts, then the blocks below the program cards: the campus history, vision and mission, organization, events, and anything common to every program. Only admins and focal persons edit them; changes stay as drafts until published."
/>

<div class="mt-8">
	<SiteTextsCard texts={data.texts} canManage={data.canManage} />
</div>

<LandingPageEditor
	label="Home"
	publicHref="/"
	folderId="site"
	blocks={data.blocks}
	error={data.error}
	canEdit={data.canEdit}
	canManage={data.canManage}
	empty="No blocks yet. The home page shows the title and the program cards until you add some."
	previewSrc="/admin/home/preview"
/>
