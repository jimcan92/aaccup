import { json } from '@sveltejs/kit';
import { requireStaff } from '#lib/server/admin.js';
import { blockLabel, hasContent, type BlockKind, type LandingBlock } from '#lib/landing.js';
import type { RequestHandler } from './$types';

/**
 * Blocks from the other pages, for the Add block dialog's "Copy from another page".
 * ?exclude=<program id>, or "site" for the home page. Each block carries its live content,
 * else its draft, and each page its colors so the preview looks as it does there.
 */
export const GET: RequestHandler = async ({ locals, url }) => {
	const { supabase } = requireStaff(locals);
	const exclude = url.searchParams.get('exclude') ?? '';

	const [{ data: blocks }, { data: programs }] = await Promise.all([
		supabase.from('program_blocks').select('id, kind, program_id, draft, published, sort_order').order('sort_order').order('created_at'),
		supabase.from('programs').select('id, code, name, sort_order, theme_program, theme_ink, theme_soft, theme_contrast').order('sort_order')
	]);

	const pages = [
		{ id: 'site', label: 'Home page', theme: null },
		...(programs ?? []).map((program) => ({
			id: program.id as string,
			label: `${program.code} — ${program.name}`,
			theme: {
				program: program.theme_program || '#082a2c',
				ink: program.theme_ink || '#082a2c',
				soft: program.theme_soft || '#e3e9e1',
				contrast: program.theme_contrast || '#ffffff'
			}
		}))
	];

	const sources = pages
		.filter((page) => page.id !== exclude)
		.map((page) => ({
			...page,
			blocks: (blocks ?? [])
				.filter((block) => (block.program_id ?? 'site') === page.id)
				.map((block) => {
					const content = (block.published ?? block.draft) as Record<string, unknown>;
					return {
						id: block.id as string,
						kind: block.kind as BlockKind,
						label: blockLabel(block.kind as BlockKind, content?.layout as string | undefined),
						title: String(content?.title ?? ''),
						live: block.published !== null,
						content
					};
				})
				.filter((block) => hasContent({ id: block.id, kind: block.kind, content: block.content } as LandingBlock))
		}))
		.filter((page) => page.blocks.length);

	return json({ sources }, { headers: { 'cache-control': 'private, no-store' } });
};
