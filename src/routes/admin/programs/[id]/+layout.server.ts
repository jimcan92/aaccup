import { error } from '@sveltejs/kit';
import { requireStaff } from '#lib/server/admin.js';
import type { LayoutServerLoad } from './$types';

// The program header and tabs shown on every page of a program.
export const load: LayoutServerLoad = async ({ locals, params }) => {
	const { supabase } = requireStaff(locals);
	const { data: header } = await supabase.from('programs').select('id, code, name, slug').eq('id', params.id).maybeSingle();
	if (!header) error(404, 'Program not found');
	return { header };
};
