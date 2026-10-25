/**
 * The small set of formatting the block editors allow in body text:
 *   **bold**, *italic*, [link text](https://…), and lines starting with "- " or "1. " for lists.
 * Paragraphs are separated by an empty line, as before. No fonts, colours or sizes, and no HTML:
 * the text is parsed into parts and rendered by components/site/rich-text.svelte, so nothing is injected.
 */

export type Inline =
	| { kind: 'text'; text: string }
	| { kind: 'bold'; text: string }
	| { kind: 'italic'; text: string }
	| { kind: 'link'; text: string; href: string };

export type RichBlock =
	| { kind: 'p'; parts: Inline[] }
	| { kind: 'ul' | 'ol'; items: Inline[][] };

const bullet = /^\s*[-*•]\s+/;
const numbered = /^\s*\d+[.)]\s+/;
// Bold before italic, so "**x**" is not read as two italics. The stars must hug a word ("a*b" and
// "2 * 3" stay as typed). Links: https, mailto, tel, or a site path; anything else stays plain text.
const inline =
	/(?<![\w*])\*\*(?![\s*])(.+?)(?<![\s*])\*\*(?![\w*])|(?<![\w*])\*(?![\s*])(.+?)(?<![\s*])\*(?![\w*])|\[([^\]]+)\]\(((?:https?:\/\/|mailto:|tel:|\/)[^\s)]*)\)/g;

export function parseInline(text: string): Inline[] {
	const parts: Inline[] = [];
	let last = 0;

	for (const match of text.matchAll(inline)) {
		const start = match.index ?? 0;
		if (start > last) parts.push({ kind: 'text', text: text.slice(last, start) });
		if (match[1] !== undefined) parts.push({ kind: 'bold', text: match[1] });
		else if (match[2] !== undefined) parts.push({ kind: 'italic', text: match[2] });
		else parts.push({ kind: 'link', text: match[3], href: match[4] });
		last = start + match[0].length;
	}

	if (last < text.length) parts.push({ kind: 'text', text: text.slice(last) });
	return parts;
}

export function parseRich(text: string | undefined): RichBlock[] {
	const blocks: RichBlock[] = [];

	for (const chunk of (text ?? '').split(/\n\s*\n/)) {
		let lines: string[] = [];
		const flush = () => {
			const joined = lines.join(' ').trim();
			if (joined) blocks.push({ kind: 'p', parts: parseInline(joined) });
			lines = [];
		};

		// Within a paragraph, a run of "- " or "1. " lines becomes a list; other lines stay text.
		for (const line of chunk.split('\n')) {
			const kind = bullet.test(line) ? 'ul' : numbered.test(line) ? 'ol' : null;
			if (!kind) {
				lines.push(line.trim());
				continue;
			}

			flush();
			const item = parseInline(line.replace(kind === 'ul' ? bullet : numbered, '').trim());
			const previous = blocks.at(-1);
			if (previous && previous.kind === kind && !lines.length) previous.items.push(item);
			else blocks.push({ kind, items: [item] });
		}

		flush();
		// A blank line ends a list, so the next list starts fresh.
		blocks.push({ kind: 'p', parts: [] });
	}

	return blocks.filter((block) => block.kind !== 'p' || block.parts.length);
}
