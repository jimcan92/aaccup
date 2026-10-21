<script lang="ts">
	import { programs } from '$lib/data/accreditation';
	import { nav, site } from '$lib/data/site';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import Logo from './logo.svelte';
</script>

<footer class="bg-ink text-paper">
	<div class="mx-auto max-w-[1280px] px-5 py-14 sm:px-8">
		<div class="grid gap-10 border-b border-paper/10 pb-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
			<div>
				<Logo tone="dark" />
				<p class="mt-5 max-w-xs text-[13px] leading-relaxed text-paper/55">
					{site.intro}
				</p>
			</div>

			<div>
				<p class="font-mono text-[10px] text-paper/40">Programs</p>
				<ul class="mt-4 space-y-3">
					{#each programs as program (program.slug)}
						<li>
							<a
								href={`/programs/${program.slug}`}
								class="group inline-flex items-center gap-2 text-[13px] text-paper/75 transition-colors hover:text-paper"
							>
								<span class="size-1.5" style:background={program.accent} aria-hidden="true"></span>
								{program.code}
								<span class="text-paper/40">— {program.level}</span>
							</a>
						</li>
					{/each}
				</ul>
			</div>

			<div>
				<p class="font-mono text-[10px] text-paper/40">The record</p>
				<ul class="mt-4 space-y-3">
					{#each nav as item (item.href)}
						<li>
							<a
								href={item.href}
								class="text-[13px] text-paper/75 transition-colors hover:text-paper"
							>
								{item.label}
							</a>
						</li>
					{/each}
					<li>
						<a
							href="https://www.ctu.edu.ph/"
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-1 text-[13px] text-paper/75 transition-colors hover:text-paper"
						>
							CTU official website
							<ArrowUpRight class="size-3" />
						</a>
					</li>
				</ul>
			</div>

			<div>
				<p class="font-mono text-[10px] text-paper/40">Campus</p>
				<p class="mt-4 text-[13px] leading-relaxed text-paper/75">
					{site.campus}<br />
					{site.address}
				</p>
				<p class="mt-5 max-w-[26ch] text-[11px] leading-relaxed text-paper/40">
					{site.contactNote}
				</p>
			</div>
		</div>

		<div class="flex flex-col gap-3 pt-6 text-[10px] text-paper/40 sm:flex-row sm:items-center sm:justify-between">
			<p>© {site.surveyYear} {site.campus}. All rights reserved.</p>
			<p class="max-w-2xl sm:text-right">{site.driveNote}</p>
		</div>
	</div>
</footer>
