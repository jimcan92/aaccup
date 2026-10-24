<script lang="ts">
	import Printer from '@lucide/svelte/icons/printer';
	import { countLinked, sectionsOf } from '#lib/data/accreditation.js';
	import { isLinked } from '#lib/drive-url.js';
	import type { Section, SectionKind } from '#lib/data/types.js';
	import { formatDate, manilaDay, pad2 } from '#lib/format.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const { program, visit, base } = $derived(data);

	const groups = $derived(
		([
			['common', 'Common documents'],
			['current', `Current visit · ${visit.year}`],
			['previous', visit.previousLabel ? `Previous visit · ${visit.previousLabel}` : 'Previous visit']
		] as [SectionKind, string][])
			.map(([kind, label]) => ({ kind, label, sections: sectionsOf(visit, kind) }))
			.filter((group) => group.sections.length)
	);

	const printed = new Intl.DateTimeFormat('en-PH', { dateStyle: 'long', timeZone: 'Asia/Manila' }).format(new Date());

	function title(section: Section) {
		return section.kind === 'previous' && section.number ? `Area ${section.number}: ${section.title}` : section.title;
	}

	// Print on paper colours even when the visitor reads the site in dark mode.
	let wasDark = false;
	function beforePrint() {
		wasDark = document.documentElement.classList.contains('dark');
		document.documentElement.classList.remove('dark');
	}
	function afterPrint() {
		if (wasDark) document.documentElement.classList.add('dark');
	}
</script>

<svelte:window onbeforeprint={beforePrint} onafterprint={afterPrint} />

<svelte:head>
	<title>Evidence index · {program.code} {visit.year} · AACCUP · CTU Moalboal</title>
	<meta name="description" content={`Printable evidence index with a QR code for every section of the ${program.code} ${visit.year} ${visit.label}.`} />
</svelte:head>

<article class="print:text-black">
	<header class="border-b-2 border-program pb-5">
		<p class="font-mono text-[12px] text-program-ink">{program.code} · {visit.year} {visit.label}</p>
		<h1 class="mt-2 font-display text-[clamp(1.9rem,4.4vw,3rem)] font-semibold leading-[0.95] tracking-[-0.05em] text-ink">Evidence index</h1>
		<p class="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-soft">
			{program.name}. Every section with its documents and a QR code to its page. Put it at the front of the exhibit binders or
			beside each area’s table so evaluators can open the files on their phones.
		</p>
		<div class="mt-4 flex flex-wrap items-center gap-3">
			<button
				type="button"
				onclick={() => window.print()}
				class="inline-flex h-10 items-center gap-2 bg-program px-4 text-[13px] font-medium text-program-contrast hover:opacity-90 print:hidden"
			>
				<Printer class="size-4" /> Print or save as PDF
			</button>
			<p class="font-mono text-[11px] text-ink-soft">Printed {printed} · {data.origin.replace(/^https?:\/\//, '')}{base}</p>
		</div>
	</header>

	{#each groups as group (group.kind)}
		<section class="mt-8">
			<h2 class="border-b border-ink/20 pb-2 font-display text-[20px] font-semibold tracking-[-0.03em] text-ink print:break-after-avoid">{group.label}</h2>

			{#each group.sections as section (section.slug)}
				{@const linked = countLinked(section.documents)}
				{@const updated = formatDate(manilaDay(section.updatedAt))}
				<div class="grid grid-cols-[minmax(0,1fr)_6.5rem] gap-5 border-b border-rule py-5 break-inside-avoid sm:grid-cols-[minmax(0,1fr)_8rem]">
					<div class="min-w-0">
						<p class="font-mono text-[11px] text-program-ink">
							{section.kind === 'common' ? '§' : section.number ? pad2(section.number) : '··'} · {linked}/{section.documents.length} linked
							{#if section.recommendations?.length}· {section.recommendations.filter((item) => item.status === 'complied').length}/{section.recommendations.length} recommendations complied{/if}
						</p>
						<h3 class="mt-1 font-display text-[17px] font-semibold leading-snug tracking-[-0.02em] text-ink">{title(section)}</h3>
						{#if section.chair || updated}
							<p class="mt-1 text-[12px] text-ink-soft">
								{#if section.chair}Area chair: <span class="font-medium text-ink">{section.chair}</span>{/if}
								{#if section.chair && updated} · {/if}
								{#if updated}Last updated {updated}{/if}
							</p>
						{/if}
						{#if section.documents.length}
							<ol class="mt-3 space-y-1 text-[12.5px] leading-snug">
								{#each section.documents as document (document.id)}
									<li class="flex gap-2">
										<span class="w-4 shrink-0 text-ink-soft" aria-hidden="true">{isLinked(document) ? '✓' : '○'}</span>
										<span class="min-w-0">
											{#if document.code}<span class="font-mono text-[11px] text-program-ink">{document.code}</span> {/if}
											<span class="text-ink">{document.title}</span>
											{#if !isLinked(document)}<span class="font-mono text-[10.5px] text-ink-soft"> (in preparation)</span>{/if}
										</span>
									</li>
								{/each}
							</ol>
						{/if}
					</div>
					<div class="text-center">
						<a href={`${base}/${section.slug}`} class="block bg-white p-1.5 text-black" aria-label={`Open ${title(section)}`}>
							<!-- Generated on the server from this site's own URL. -->
							{@html data.qr[section.slug]}
						</a>
						<p class="mt-1 break-all font-mono text-[9.5px] leading-tight text-ink-soft">{base}/{section.slug}</p>
					</div>
				</div>
			{/each}
		</section>
	{/each}
</article>
