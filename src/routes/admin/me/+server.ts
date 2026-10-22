import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Tells public pages whether to show staff links ("Manage", quick actions). Public pages are
 * cached for everyone, so they ask here from the browser instead of rendering the links.
 * With ?program=<slug>, staff also get that program's id for links into the admin.
 * The hook has already resolved the SSO user and AACCUP profile for /admin paths.
 */
export const GET: RequestHandler = async ({ locals, url }) => {
	const staff = Boolean(locals.staff);
	let programId: string | null = null;

	const slug = url.searchParams.get('program');
	if (staff && slug && locals.supabase) {
		const { data } = await locals.supabase.from('programs').select('id').eq('slug', slug).maybeSingle();
		programId = data?.id ?? null;
	}

	return json({ staff, programId }, { headers: { 'cache-control': 'private, no-store' } });
};
