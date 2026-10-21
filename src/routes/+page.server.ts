import { createClient } from '@supabase/supabase-js';
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

export const load: PageServerLoad = async ({ setHeaders }) => {
	setHeaders({
		'cache-control': 'public, s-maxage=60, stale-while-revalidate=300'
	});

	const blocks: Record<string, string> = {};

	if (env.PUBLIC_SUPABASE_URL && env.PUBLIC_SUPABASE_ANON_KEY) {
		try {
			const supabase = createClient(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY, {
				auth: { persistSession: false, autoRefreshToken: false }
			});

			const { data } = await supabase
				.from('content_blocks')
				.select('key, published_value')
				.eq('status', 'published');

			for (const row of data ?? []) {
				if (row.published_value !== null) {
					blocks[row.key] = row.published_value;
				}
			}
		} catch {
			// The public page must keep working if Supabase is unreachable.
		}
	}

	const text = (key: string, fallback: string) => blocks[key] ?? fallback;

	return {
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
