import { error } from '@sveltejs/kit';
import { requireStaff } from '$lib/server/admin';
import { loadDossier } from '$lib/server/dossier';
import { loadBlocks } from '$lib/server/landing-blocks';
import type { LandingBlock } from '$lib/landing';
import type { PageServerLoad } from './$types';

// The program page as it would look with every draft published; shown in the editor's preview frame.
export const load: PageServerLoad = async ({ locals, params, setHeaders }) => {
	const { supabase } = requireStaff(locals);
	setHeaders({ 'cache-control': 'private, no-store' });

	const { data: program } = await supabase.from('programs').select('slug').eq('id', params.id).maybeSingle();
	if (!program) error(404, 'Program not found');
	const dossier = await loadDossier(program.slug);
	if (!dossier) error(404, 'Publish the program before previewing its page.');

	const { blocks } = await loadBlocks(supabase, params.id);
	return {
		program: dossier.program,
		visit: dossier.visit,
		blocks: blocks.map((block) => ({ id: block.id, kind: block.kind, content: block.draft }) as LandingBlock),
		drafts: blocks.filter((block) => block.published === null).map((block) => block.id)
	};
};
