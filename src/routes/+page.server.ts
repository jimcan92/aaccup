import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';
import { loadProgramCards } from '$lib/server/dossier';
import { ACTIVE_CONTENT_KEYS, site as defaultSite } from '$lib/data/site';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ setHeaders, url, locals }) => {
	const preview = url.searchParams.get('preview') === '1' && ['admin', 'focal', 'reviewer'].includes(locals.staff?.role ?? '');

	setHeaders(
		preview
			? { 'cache-control': 'no-store' }
			: { 'cache-control': 'public, s-maxage=60, stale-while-revalidate=300' }
	);

	const blocks: Record<string, string> = {};

	if (env.PUBLIC_SUPABASE_URL && env.PUBLIC_SUPABASE_ANON_KEY) {
		try {
			if (preview && locals.supabase) {
				// locals.supabase is the staff member's client here, so drafts are read under RLS.
				const { data } = await locals.supabase
					.from('content_blocks')
					.select('key, draft_value, published_value');

				for (const row of data ?? []) {
					const value = row.draft_value ?? row.published_value;
					if (value !== null) {
						blocks[row.key] = value;
					}
				}
			} else {
				const supabase = createClient(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY, {
					auth: { persistSession: false, autoRefreshToken: false }
				});

				const { data } = await supabase.rpc('published_content');

				for (const row of data ?? []) {
					if (row.value !== null) {
						blocks[row.key] = row.value;
					}
				}
			}
		} catch {
			// The public page must keep working if Supabase is unreachable.
		}
	}

	const text = (key: (typeof ACTIVE_CONTENT_KEYS)[number], fallback: string) => blocks[key] ?? fallback;

	const cards = await loadProgramCards();

	return {
		preview,
		programs: cards,
		content: {
			title: text('site.title', defaultSite.title),
			description: text('site.description', defaultSite.description),
			contactNote: text('site.contact_note', defaultSite.contactNote)
		}
	};
};
