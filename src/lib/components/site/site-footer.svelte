<script lang="ts">
	import { site } from '$lib/data/site';
	import { cn } from '$lib/utils';

	let {
		contactNote = site.contactNote,
		themed = false,
		children
	}: {
		contactNote?: string;
		/** Program pages use the program's dark ink; the index stays neutral. */
		themed?: boolean;
		children?: import('svelte').Snippet;
	} = $props();
</script>

<footer
	class={cn(
		'mt-auto',
		themed ? 'on-program bg-program-ink text-program-contrast' : 'border-t border-rule bg-paper text-ink'
	)}
>
	<div class="mx-auto flex max-w-[1280px] flex-col gap-6 px-5 py-8 sm:px-8 md:flex-row md:items-start md:justify-between">
		<div class="max-w-xl space-y-2">
			{#if children}
				{@render children()}
			{/if}
			<p class="text-[13px] leading-relaxed opacity-80">{contactNote}</p>
			<p class="text-[12px] leading-relaxed opacity-65">{site.driveNote}</p>
		</div>

		<div class="flex shrink-0 flex-col gap-2 text-[13px] md:items-end">
			<p class="text-[12px] opacity-65">© {new Date().getFullYear()} {site.campus}</p>
		</div>
	</div>
</footer>
