<script lang="ts">
	import Globe from '@lucide/svelte/icons/globe';
	import Mail from '@lucide/svelte/icons/mail';
	import Phone from '@lucide/svelte/icons/phone';
	import type { Program } from '$lib/data/types';
	import { imageSrc } from '$lib/image-url';

	// The program's email, phone and website: compact chips in the hero, or tiles in their own section.
	let { program, variant }: { program: Program; variant: 'chips' | 'section' } = $props();

	const host = (url: string) => {
		try {
			return new URL(url).hostname.replace(/^www\./, '');
		} catch {
			return url;
		}
	};

	const items = $derived(
		[
			program.email && { label: 'Email', value: program.email, href: `mailto:${program.email}`, icon: Mail, external: false },
			program.phone && { label: 'Call', value: program.phone, href: `tel:${program.phone.replace(/[^\d+]/g, '')}`, icon: Phone, external: false },
			program.website && { label: 'Website', value: host(program.website), href: program.website, icon: Globe, external: true }
		].filter((item) => !!item)
	);
</script>

{#if items.length && variant === 'chips'}
	<ul class="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[14px]" aria-label="Contact the program">
		{#each items as item (item.label)}
			{@const Icon = item.icon}
			<li>
				<a href={item.href} target={item.external ? '_blank' : undefined} rel={item.external ? 'noopener noreferrer' : undefined} class="inline-flex items-center gap-2 opacity-90 underline-offset-4 hover:underline hover:opacity-100">
					<Icon class="size-4" /><span>{item.value}</span>
				</a>
			</li>
		{/each}
	</ul>
{:else if items.length}
	<section class="on-program border-b border-rule bg-program-soft" aria-labelledby="contact-heading">
		<div class="mx-auto max-w-[1280px] px-5 py-14 sm:px-8">
			<div class="flex flex-wrap items-end justify-between gap-4">
				<div class="flex items-center gap-4">
					{#if program.logo}<img src={imageSrc(program.logo, 200)} alt="" class="size-14 shrink-0 bg-paper object-contain p-1.5" />{/if}
					<div>
						<p class="font-mono text-[12px] text-program-ink/80">{program.code}</p>
						<h2 id="contact-heading" class="font-display text-[clamp(1.6rem,3.2vw,2.4rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-program-ink">Contact the program</h2>
					</div>
				</div>
			</div>
			<ul class="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{#each items as item (item.label)}
					{@const Icon = item.icon}
					<li>
						<a
							href={item.href}
							target={item.external ? '_blank' : undefined}
							rel={item.external ? 'noopener noreferrer' : undefined}
							class="group flex h-full items-center gap-4 border border-rule bg-paper p-5 transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-20px_rgb(0_0_0/0.45)]"
						>
							<span class="grid size-11 shrink-0 place-items-center bg-program text-program-contrast"><Icon class="size-5" /></span>
							<span class="min-w-0">
								<span class="block font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">{item.label}</span>
								<span class="block truncate text-[15px] font-semibold text-ink group-hover:text-program">{item.value}</span>
							</span>
						</a>
					</li>
				{/each}
			</ul>
		</div>
	</section>
{/if}
