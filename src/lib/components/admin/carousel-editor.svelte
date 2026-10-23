<script lang="ts">
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import ImagePlus from '@lucide/svelte/icons/image-plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { Input } from '#lib/components/ui/input/index.js';

	type Slide = {
		src: string;
		alt: string;
		caption: string;
		meta: string;
	};

	let {
		value = $bindable(''),
		disabled = false,
		onchange
	}: {
		value?: string;
		disabled?: boolean;
		onchange?: () => void;
	} = $props();

	function parse(raw: string): Slide[] {
		try {
			const parsed = JSON.parse(raw);
			if (!Array.isArray(parsed)) return [];
			return parsed.filter(
				(slide): slide is Slide =>
					Boolean(slide) &&
					typeof slide === 'object' &&
					typeof slide.src === 'string' &&
					typeof slide.alt === 'string' &&
					typeof slide.caption === 'string' &&
					typeof slide.meta === 'string'
			);
		} catch {
			return [];
		}
	}

	let slides = $state<Slide[]>(parse(value));
	let uploading = $state<number | null>(null);
	let error = $state('');

	function commit() {
		value = JSON.stringify(slides, null, 2);
		onchange?.();
	}

	function update(index: number, field: keyof Slide, next: string) {
		slides[index] = { ...slides[index], [field]: next };
		commit();
	}

	function addSlide() {
		slides.push({ src: '', alt: '', caption: '', meta: '' });
		commit();
	}

	function removeSlide(index: number) {
		slides.splice(index, 1);
		commit();
	}

	function move(index: number, direction: -1 | 1) {
		const target = index + direction;
		if (target < 0 || target >= slides.length) return;
		const [slide] = slides.splice(index, 1);
		slides.splice(target, 0, slide);
		commit();
	}

	async function upload(index: number, file: File) {
		uploading = index;
		error = '';

		const body = new FormData();
		body.append('file', file);

		try {
			const response = await fetch('/admin/upload', { method: 'POST', body });
			const data = await response.json();

			if (!response.ok) {
				error = data.error ?? 'Upload failed.';
				return;
			}

			slides[index] = { ...slides[index], src: data.url };
			commit();
		} catch {
			error = 'Upload failed. Check your connection and try again.';
		} finally {
			uploading = null;
		}
	}
</script>

<div>
	<div class="flex items-center justify-between border-b border-rule pb-2">
		<div>
			<p class="font-mono text-[12px] text-ink-soft">Carousel slides</p>
			<p class="mt-1 text-[13px] text-ink-soft">Upload images and edit captions. Changes save as a draft automatically.</p>
		</div>
		<button
			type="button"
			onclick={addSlide}
			disabled={disabled}
			class="inline-flex h-8 items-center gap-1.5 border border-ink/20 px-3 text-[13px] font-medium text-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-40"
		>
			<ImagePlus class="size-3.5" />
			Add slide
		</button>
	</div>

	{#if error}
		<div class="mt-3 border border-destructive/30 bg-destructive/5 p-3 text-[13px] text-destructive">{error}</div>
	{/if}

	{#if slides.length === 0}
		<div class="mt-4 border border-dashed border-ink/25 bg-salt p-8 text-center">
			<p class="font-display text-lg font-semibold tracking-[-0.03em]">No slides yet.</p>
			<p class="mt-1 text-[13px] text-ink-soft">Add a slide, then upload its image.</p>
		</div>
	{/if}

	<div class="mt-4 space-y-4">
		{#each slides as slide, index}
			<div class="border border-rule bg-paper p-3">
				<div class="grid gap-4 sm:grid-cols-[11rem_1fr]">
					<div>
						<div class="relative aspect-[16/10] overflow-hidden bg-ink">
							{#if slide.src}
								<img
									src={slide.src}
									alt={slide.alt || slide.caption || `Slide ${index + 1}`}
									class="absolute inset-0 h-full w-full object-cover"
									onerror={(event) => {
										(event.currentTarget as HTMLImageElement).style.opacity = '0';
									}}
								/>
							{:else}
								<div class="grid h-full place-items-center px-3 text-center font-mono text-[12px] text-paper/40">
									No image
								</div>
							{/if}
						</div>

						<label class="mt-2 flex h-8 cursor-pointer items-center justify-center gap-1.5 border border-ink/20 text-[12px] font-medium text-ink hover:bg-salt">
							<ImagePlus class="size-3" />
							{uploading === index ? 'Uploading…' : 'Upload image'}
							<input
								type="file"
								accept="image/jpeg,image/png,image/webp,image/avif"
								class="sr-only"
								disabled={disabled || uploading === index}
								onchange={(event) => {
									const file = event.currentTarget.files?.[0];
									if (file) upload(index, file);
								}}
							/>
						</label>
					</div>

					<div class="space-y-2">
						<div>
							<label class="mb-1 block font-mono text-[13px] text-ink-soft" for={`caption-${index}`}>Caption</label>
							<Input
								id={`caption-${index}`}
								value={slide.caption}
								disabled={disabled}
								oninput={(event) => update(index, 'caption', event.currentTarget.value)}
								class="h-8 rounded-none border-rule bg-salt text-[13px]"
								placeholder="Charting the path to 2030"
							/>
						</div>
						<div>
							<label class="mb-1 block font-mono text-[13px] text-ink-soft" for={`meta-${index}`}>Meta</label>
							<Input
								id={`meta-${index}`}
								value={slide.meta}
								disabled={disabled}
								oninput={(event) => update(index, 'meta', event.currentTarget.value)}
								class="h-8 rounded-none border-rule bg-salt text-[13px]"
								placeholder="University strategic planning · April 2026"
							/>
						</div>
						<div>
							<label class="mb-1 block font-mono text-[13px] text-ink-soft" for={`alt-${index}`}>Alt text</label>
							<Input
								id={`alt-${index}`}
								value={slide.alt}
								disabled={disabled}
								oninput={(event) => update(index, 'alt', event.currentTarget.value)}
								class="h-8 rounded-none border-rule bg-salt text-[13px]"
								placeholder="Describe the image for screen readers"
							/>
						</div>

						<div class="flex items-center justify-end gap-1 pt-1">
							<button
								type="button"
								onclick={() => move(index, -1)}
								disabled={disabled || index === 0}
								class="grid size-7 place-items-center border border-rule text-ink-soft hover:text-ink disabled:opacity-30"
								aria-label={`Move slide ${index + 1} up`}
							>
								<ArrowUp class="size-3" />
							</button>
							<button
								type="button"
								onclick={() => move(index, 1)}
								disabled={disabled || index === slides.length - 1}
								class="grid size-7 place-items-center border border-rule text-ink-soft hover:text-ink disabled:opacity-30"
								aria-label={`Move slide ${index + 1} down`}
							>
								<ArrowDown class="size-3" />
							</button>
							<button
								type="button"
								onclick={() => removeSlide(index)}
								disabled={disabled}
								class="grid size-7 place-items-center border border-rule text-ink-soft hover:border-destructive hover:text-destructive disabled:opacity-30"
								aria-label={`Remove slide ${index + 1}`}
							>
								<Trash2 class="size-3" />
							</button>
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
