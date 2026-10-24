import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$app/env/public';
import { loadProgramCards } from '#lib/server/dossier.js';
import { loadProgramPage, loadSitePage } from '#lib/server/program-page.js';
import { followCodes } from '#lib/server/program-code.js';
import { ACTIVE_CONTENT_KEYS, site as defaultSite } from '#lib/data/site.js';
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

	if (PUBLIC_SUPABASE_URL && PUBLIC_SUPABASE_ANON_KEY) {
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
				const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
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

	const [programCards, siteBlocks] = await Promise.all([loadProgramCards(), loadSitePage()]);

	// Program codes in the site texts follow each program's saved code ("BSFI" reads "BSFi").
	const codes = programCards.map((card) => card.code);
	const text = (key: (typeof ACTIVE_CONTENT_KEYS)[number], fallback: string) => followCodes(blocks[key] ?? fallback, codes);

	// A card without its own cover uses the first photo of the program page's gallery.
	const cards = await Promise.all(
		programCards.map(async (card) => {
		if (card.cover) return card;
		const blocks = await loadProgramPage(card.slug);
		const gallery = blocks.find((block) => block.kind === 'gallery' && block.content.items?.[0]?.src);

		return {
			...card,
			cover: gallery?.kind === 'gallery' ? gallery.content.items[0].src : undefined
		};
	}));

	return {
		preview,
		programs: cards,
		blocks: siteBlocks,
		// Set only by the admin preview, which renders this page with draft blocks.
		editable: false as boolean,
		drafts: [] as string[],
		content: {
			title: text('site.title', defaultSite.title),
			description: text('site.description', defaultSite.description),
			contactNote: text('site.contact_note', defaultSite.contactNote),
			// The large heading and the line under it at the top of the home page.
			heading: text('home.hero.title', 'AACCUP Accreditation'),
			intro: text('home.hero.intro', '')
		}
	};
};
