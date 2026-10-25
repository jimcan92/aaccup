import type { LandingBlock } from '#lib/landing.js';
import type { Program } from '#lib/data/types.js';

/** The program details form's fields as typed, unsaved: the program page preview shows them. */
export type ProgramPatch = Pick<Program, 'code' | 'name' | 'degree' | 'summary' | 'tagline' | 'logo' | 'cover' | 'website' | 'email' | 'phone' | 'theme'>;

/**
 * Messages between a block editor page and its preview frame (same origin).
 * editor → preview: the blocks to show, which block to scroll to, and the program's unsaved details.
 * preview → editor: ready (send me the blocks), and the block that was clicked.
 */
export type PreviewMessage =
	| { type: 'aaccup:blocks'; blocks: LandingBlock[]; drafts: string[] }
	| { type: 'aaccup:scroll'; id: string }
	| { type: 'aaccup:program'; program: ProgramPatch }
	| { type: 'aaccup:ready' }
	| { type: 'aaccup:select'; id: string };

export function readMessage(event: MessageEvent): PreviewMessage | null {
	if (event.origin !== location.origin) return null;
	const data = event.data as PreviewMessage | null;
	return data && typeof data.type === 'string' && data.type.startsWith('aaccup:') ? data : null;
}

/**
 * Run inside the preview frame: receive blocks and scroll requests, and turn clicks into
 * "select this block" (links and buttons do nothing in a preview). Returns a cleanup function.
 */
export function connectPreview(
	onBlocks: (blocks: LandingBlock[], drafts: string[]) => void,
	onProgram?: (program: ProgramPatch) => void
): () => void {
	const post = (message: PreviewMessage) => window.parent.postMessage(message, location.origin);

	const onMessage = (event: MessageEvent) => {
		const message = readMessage(event);
		if (message?.type === 'aaccup:blocks') onBlocks(message.blocks, message.drafts);
		if (message?.type === 'aaccup:program') onProgram?.(message.program);
		if (message?.type === 'aaccup:scroll') {
			document.querySelector(`[data-block-id="${CSS.escape(message.id)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	};

	const onClick = (event: MouseEvent) => {
		const target = event.target as Element | null;
		// The FAQ and timeline fold open on click; let those through, but select the block too.
		const folds = target?.closest('summary');
		if (!folds) event.preventDefault();
		event.stopPropagation();
		const block = target?.closest('[data-block-id]');
		if (block) post({ type: 'aaccup:select', id: block.getAttribute('data-block-id') ?? '' });
	};

	window.addEventListener('message', onMessage);
	document.addEventListener('click', onClick, true);
	post({ type: 'aaccup:ready' });
	return () => {
		window.removeEventListener('message', onMessage);
		document.removeEventListener('click', onClick, true);
	};
}
