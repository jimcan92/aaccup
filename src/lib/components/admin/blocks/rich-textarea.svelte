<script lang="ts">
	import Bold from '@lucide/svelte/icons/bold';
	import Italic from '@lucide/svelte/icons/italic';
	import Link from '@lucide/svelte/icons/link';
	import List from '@lucide/svelte/icons/list';
	import ListOrdered from '@lucide/svelte/icons/list-ordered';
	import { tick } from 'svelte';
	import { area } from './ui';

	// A body text box with the small formatting set the public pages render (rich-text.ts):
	// bold, italic, links and lists. The buttons only type the markers; the text stays plain.
	let {
		value = $bindable(),
		rows = 5,
		placeholder = 'Leave an empty line between paragraphs.',
		ariaLabel
	}: { value?: string; rows?: number; placeholder?: string; ariaLabel?: string } = $props();

	let box = $state<HTMLTextAreaElement>();

	async function apply(edit: (text: string, start: number, end: number) => { text: string; start: number; end: number }) {
		if (!box) return;
		const next = edit(box.value, box.selectionStart, box.selectionEnd);
		value = next.text;
		await tick();
		box.focus();
		box.setSelectionRange(next.start, next.end);
	}

	// Wraps the selection (or a placeholder word) in markers, or unwraps it when already wrapped.
	function wrap(marker: string, fallback: string) {
		apply((text, start, end) => {
			const before = text.slice(0, start);
			const after = text.slice(end);
			if (before.endsWith(marker) && after.startsWith(marker)) {
				return { text: before.slice(0, -marker.length) + text.slice(start, end) + after.slice(marker.length), start: start - marker.length, end: end - marker.length };
			}
			const inner = text.slice(start, end) || fallback;
			return { text: before + marker + inner + marker + after, start: start + marker.length, end: start + marker.length + inner.length };
		});
	}

	function link() {
		apply((text, start, end) => {
			const label = text.slice(start, end) || 'link text';
			const url = 'https://';
			const inserted = `[${label}](${url})`;
			// Selects the address so it can be pasted over straight away.
			const urlStart = start + label.length + 3;
			return { text: text.slice(0, start) + inserted + text.slice(end), start: urlStart, end: urlStart + url.length };
		});
	}

	// Turns the selected lines into a list, numbered or not; again on a list removes the markers.
	function list(numbered: boolean) {
		apply((text, start, end) => {
			const lineStart = text.lastIndexOf('\n', start - 1) + 1;
			const nextBreak = text.indexOf('\n', end);
			const lineEnd = nextBreak === -1 ? text.length : nextBreak;
			const lines = text.slice(lineStart, lineEnd).split('\n');
			const marker = numbered ? /^\d+[.)]\s+/ : /^[-*•]\s+/;
			const listed = lines.every((line) => !line.trim() || marker.test(line));
			const changed = lines.map((line, index) => {
				if (!line.trim()) return line;
				const plain = line.replace(/^(?:\d+[.)]|[-*•])\s+/, '');
				return listed ? plain : `${numbered ? `${index + 1}.` : '-'} ${plain}`;
			});
			const block = changed.join('\n');
			return { text: text.slice(0, lineStart) + block + text.slice(lineEnd), start: lineStart, end: lineStart + block.length };
		});
	}

	function onkeydown(event: KeyboardEvent) {
		if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
		const key = event.key.toLowerCase();
		if (key === 'b') wrap('**', 'bold text');
		else if (key === 'i') wrap('*', 'italic text');
		else if (key === 'k') link();
		else return;
		event.preventDefault();
	}

	const tools = [
		{ label: 'Bold (Ctrl+B)', icon: Bold, run: () => wrap('**', 'bold text') },
		{ label: 'Italic (Ctrl+I)', icon: Italic, run: () => wrap('*', 'italic text') },
		{ label: 'Link (Ctrl+K)', icon: Link, run: link },
		{ label: 'Bulleted list', icon: List, run: () => list(false) },
		{ label: 'Numbered list', icon: ListOrdered, run: () => list(true) }
	];
</script>

<div class="grid">
	<div class="flex items-center gap-0.5 border border-b-0 border-rule bg-paper px-1 py-1" role="toolbar" aria-label="Text formatting">
		{#each tools as tool (tool.label)}
			{@const Icon = tool.icon}
			<button type="button" onclick={tool.run} class="grid size-8 cursor-pointer place-items-center text-ink-soft hover:bg-salt hover:text-ink" title={tool.label} aria-label={tool.label}>
				<Icon class="size-4" />
			</button>
		{/each}
		<span class="ml-auto hidden pr-2 font-mono text-[11px] text-ink-soft sm:inline">**bold** · *italic* · - list</span>
	</div>
	<textarea bind:this={box} bind:value {rows} {placeholder} aria-label={ariaLabel} class={area} {onkeydown}></textarea>
</div>
