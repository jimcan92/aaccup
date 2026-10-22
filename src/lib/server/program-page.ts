import type { LandingBlock } from '$lib/landing';
import { supabaseAnon } from './sso';

/** Published landing blocks for a program. Empty when there are none or Supabase is unreachable. */
export async function loadProgramPage(programSlug: string): Promise<LandingBlock[]> {
	const supabase = supabaseAnon();
	if (!supabase) return [];
	try {
		const { data, error } = await supabase.rpc('published_program_page', { p_program: programSlug });
		if (error || !Array.isArray(data)) return [];
		return (data as LandingBlock[]).filter((block) => block.content && typeof block.content === 'object');
	} catch {
		return [];
	}
}
