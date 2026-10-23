<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import LandingPageEditor from '#lib/components/admin/landing-page-editor.svelte';
	import PageHeader from '#lib/components/admin/page-header.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.program.code} page · AACCUP Desk</title>
</svelte:head>

<a href={`/admin/programs/${data.program.id}`} class="inline-flex min-h-9 items-center gap-2 text-[13px] text-ink-soft hover:text-ink">
	<ArrowLeft class="size-4" />
	{data.program.code}
</a>

<div class="mt-4">
	<PageHeader
		eyebrow={`${data.program.code} · Program page`}
		title="The program’s front page"
		description={`What visitors see first at /${data.program.slug}: a photo banner, highlights, and text, above the link to the documents. Changes stay as drafts until a focal person or admin publishes them.`}
	/>
</div>

<LandingPageEditor
	label={data.program.code}
	publicHref={`/${data.program.slug}`}
	folderId={data.program.id}
	blocks={data.blocks}
	error={data.error}
	canEdit={data.canEdit}
	canManage={data.canManage}
	empty="No blocks yet. The public page shows the program title, summary, and the link to the documents until you add some."
	previewSrc={`/admin/programs/${data.program.id}/landing/preview`}
/>
