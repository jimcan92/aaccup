import { createClient } from '@supabase/supabase-js';
import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import { activeVisit, countLinked, programs, visitDocuments } from '$lib/data/accreditation';
import { ACTIVE_CONTENT_KEYS, site as defaultSite } from '$lib/data/site';
import type { PageServerLoad } from './$types';

export const prerender = false;

export const load: PageServerLoad = async ({ setHeaders, url, locals }) => {
	// Supabase falls back to the Site URL when emailRedirectTo is not allowlisted.
	// If the magic-link code lands on the home page, forward it to the callback.
	const code = url.searchParams.get('code');

	if (code && url.pathname === '/') {
		redirect(
			303,
			`/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(url.searchParams.get('next') || '/admin')}`
		);
	}

	let preview = false;

	if (url.searchParams.get('preview') === '1' && locals.supabase) {
		const { user } = await locals.safeGetSession();

		if (user) {
			const { data: profile } = await locals.supabase
				.from('profiles')
				.select('role')
				.eq('id', user.id)
				.maybeSingle();

			preview = ['admin', 'focal', 'reviewer'].includes(profile?.role ?? '');
		}
	}

	setHeaders(
		preview
			? { 'cache-control': 'no-store' }
			: { 'cache-control': 'public, s-maxage=60, stale-while-revalidate=300' }
	);

	const blocks: Record<string, string> = {};

	if (env.PUBLIC_SUPABASE_URL && env.PUBLIC_SUPABASE_ANON_KEY) {
		try {
			if (preview && locals.supabase) {
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

	const cards = [...programs]
		.sort((a, b) => a.sortOrder - b.sortOrder)
		.map((program) => {
			const visit = activeVisit(program);
			const documents = visitDocuments(visit);

			return {
				slug: program.slug,
				code: program.code,
				name: program.name,
				theme: program.theme,
				visit: { year: visit.year, label: visit.label },
				linked: countLinked(documents),
				total: documents.length
			};
		});

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
