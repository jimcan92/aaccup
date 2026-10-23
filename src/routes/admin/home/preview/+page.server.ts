import { requireStaff } from '#lib/server/admin.js';
import { loadBlocks } from '#lib/server/landing-blocks.js';
import type { LandingBlock } from '#lib/landing.js';
import { load as homeLoad } from '../../../+page.server';
import type { PageServerLoad } from './$types';

// This page skips the admin layout (+page@), so it must opt out of prerendering itself.
export const prerender = false;

// The home page as it would look with every draft published; shown in the editor's preview frame.
export const load: PageServerLoad = async (event) => {
	const { supabase } = requireStaff(event.locals);
	event.setHeaders({ 'cache-control': 'private, no-store' });

	// The home page's own data, without its public cache header.
	const home = await homeLoad({ ...event, setHeaders: () => {} } as unknown as Parameters<typeof homeLoad>[0]);
	const { blocks } = await loadBlocks(supabase, null);
	return {
		home: home as Exclude<typeof home, void>,
		blocks: blocks.map((block) => ({ id: block.id, kind: block.kind, content: block.draft }) as LandingBlock),
		drafts: blocks.filter((block) => block.published === null).map((block) => block.id)
	};
};
