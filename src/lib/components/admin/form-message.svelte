<script lang="ts">
	import { page } from '$app/state';

	let { form }: { form: { message?: string } | null | undefined } = $props();
</script>

{#if form?.message}
	<div
		class="mt-6 border p-4 text-[14px] {page.status >= 400
			? 'border-destructive/30 bg-paper text-destructive'
			: 'border-bsfi/30 bg-bsfi-soft text-ink'}"
		role={page.status >= 400 ? 'alert' : 'status'}
	>
		{form.message}
	</div>
{/if}
