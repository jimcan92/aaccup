import { renderSVG } from 'uqr';
import type { PageServerLoad } from './$types';

/** A QR code per section, pointing at its page on this site, for the printed evidence index. */
export const load: PageServerLoad = async ({ parent, url }) => {
	const { visit, base } = await parent();

	const qr: Record<string, string> = {};
	for (const section of visit.sections) {
		qr[section.slug] = renderSVG(`${url.origin}${base}/${section.slug}`, { border: 0, ecc: 'M' });
	}

	return { origin: url.origin, qr };
};
