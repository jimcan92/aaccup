import { createClient } from '@supabase/supabase-js';
import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import { campusUpdates, site as defaultSite, vmgo as defaultVmgo } from '$lib/data/site';
import type { PageServerLoad } from './$types';

export const prerender = false;

export type CarouselSlide = {
	src: string;
	alt: string;
	caption: string;
	meta: string;
};

const fallbackSlides: CarouselSlide[] = campusUpdates.map((slide) => ({
	src: slide.src,
	alt: slide.alt,
	caption: slide.caption,
	meta: slide.meta
}));

function parseSlides(raw: string | undefined): CarouselSlide[] {
	if (!raw) return fallbackSlides;

	try {
		const parsed = JSON.parse(raw);

		if (!Array.isArray(parsed)) return fallbackSlides;

		const slides = parsed.filter(
			(slide): slide is CarouselSlide =>
				Boolean(slide) &&
				typeof slide === 'object' &&
				typeof slide.src === 'string' &&
				typeof slide.alt === 'string' &&
				typeof slide.caption === 'string' &&
				typeof slide.meta === 'string'
		);

		return slides.length > 0 ? slides : fallbackSlides;
	} catch {
		return fallbackSlides;
	}
}

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

	const text = (key: string, fallback: string) => blocks[key] ?? fallback;

	return {
		preview,
		content: {
			title: text('site.title', defaultSite.title),
			description: text('site.description', defaultSite.description),
			intro: text('site.intro', defaultSite.intro),
			statusNote: text('site.status_note', defaultSite.statusNote),
			contactNote: text('site.contact_note', defaultSite.contactNote),
			address: text('site.address', defaultSite.address),
			phone: text('site.phone', defaultSite.phone),
			email: text('site.email', defaultSite.email),
			heroTitle: text('home.hero.title', 'Two volumes. One campus.'),
			heroIntro: text('home.hero.intro', defaultSite.intro),
			vision: text('vmgo.vision', defaultVmgo.vision),
			mission: text('vmgo.mission', defaultVmgo.mission),
			vmgoSource: text('vmgo.source', defaultVmgo.source),
			carousel: parseSlides(blocks['home.carousel'])
		}
	};
};
