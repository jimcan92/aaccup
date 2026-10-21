<script lang="ts">
	import { page } from '$app/state';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
</script>

<svelte:head>
	<title>{page.status} · AACCUP Level III · CTU Moalboal</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="bg-salt">
	<div class="mx-auto max-w-[1280px] px-5 py-24 sm:px-8 lg:py-32">
		<p class="font-mono text-[10px] text-ink-soft">{page.status}</p>
		<h1
			class="mt-4 max-w-3xl text-balance font-display text-[clamp(2.6rem,6vw,5rem)] font-semibold leading-[0.9] tracking-[-0.06em]"
		>
			{page.status === 404 ? 'This page is not in the record.' : 'Something went wrong.'}
		</h1>
		<p class="mt-4 max-w-xl text-[14px] leading-relaxed text-ink-soft">
			{page.status === 404
				? 'The address may be old, or the page may have moved. Start again from the dossier or search the document index.'
				: (page.error?.message ?? 'The page could not be loaded. Try again from the dossier.')}
		</p>
		<div class="mt-8 flex flex-col gap-3 sm:flex-row">
			<a
				href="/"
				class="inline-flex h-10 items-center justify-center gap-2 bg-ink px-4 text-[12px] font-medium text-paper"
			>
				<ArrowLeft class="size-4" />
				Back to the dossier
			</a>
			<a
				href="/bsie/documents"
				class="inline-flex h-10 items-center justify-center border border-ink/20 px-4 text-[12px] font-medium text-ink"
			>
				Search BSIE documents
			</a>
		</div>
	</div>
</section>
