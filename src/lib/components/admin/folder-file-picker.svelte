<script lang="ts">
	import { enhance } from '#lib/admin-enhance.js';
	import FolderFileChoice from './folder-file-choice.svelte';

	/** A folder row's own "Choose files" form, for a folder that is already published. */
	let { documentId, shown, onsaved }: { documentId: string; shown: string[] | null; onsaved?: () => void } = $props();
</script>

<form
	method="POST"
	action="?/saveShownFiles"
	use:enhance={() => async ({ result, update }) => {
		await update({ reset: false });
		if (result.type === 'success') onsaved?.();
	}}
	class="mt-3 grid gap-3 bg-paper p-4"
>
	<input type="hidden" name="id" value={documentId} />
	<FolderFileChoice {documentId} {shown} />
	<button class="h-10 w-fit bg-ink px-4 text-[13px] font-medium text-paper hover:bg-ink-soft">Save</button>
</form>
