<script lang="ts">
	import ImagePlus from '@lucide/svelte/icons/image-plus';
	import { toast } from 'svelte-sonner';
	import { imageSrc } from '$lib/image-url';
	import { field, uploadImage } from './ui';

	// A photo or logo: a thumbnail, a link field, and an Upload button.
	let { value = $bindable(''), programId, label = 'Photo', contain = false }: { value?: string; programId: string; label?: string; contain?: boolean } = $props();

	let uploading = $state(false);

	async function upload(file: File | undefined) {
		if (!file) return;
		uploading = true;
		try {
			value = await uploadImage(file, programId);
		} catch (err) {
			toast.error((err as Error).message, { duration: 9000 });
		} finally {
			uploading = false;
		}
	}
</script>

<div class="flex items-center gap-2">
	<div class="grid size-10 shrink-0 place-items-center overflow-hidden border border-rule bg-salt">
		{#if value}<img src={imageSrc(value, 200)} alt="" class="h-full w-full {contain ? 'object-contain' : 'object-cover'}" />{:else}<ImagePlus class="size-4 text-ink-soft" />{/if}
	</div>
	<input bind:value aria-label={`${label} link`} placeholder={`${label}: upload, or paste a Drive / image link`} class="{field} min-w-0 font-mono text-[12px]" />
	<label class="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 border border-rule px-3 text-[13px] font-medium hover:border-ink/30">
		<ImagePlus class="size-4" /> {uploading ? 'Uploading…' : 'Upload'}
		<input type="file" accept="image/*" class="sr-only" onchange={(event) => upload((event.currentTarget as HTMLInputElement).files?.[0])} />
	</label>
</div>
