import { error, json } from '@sveltejs/kit';
import { CRON_SECRET } from '$app/env/private';
import { driveConfigured } from '#lib/server/drive.js';
import { syncAllVisits } from '#lib/server/drive-sync.js';
import type { Config } from '@sveltejs/adapter-vercel';
import type { RequestHandler } from './$types';

// Several folders can take a while; Vercel allows up to 60s on every plan.
export const config: Config = { maxDuration: 60 };

/** Called by Vercel Cron (vercel.json). Vercel sends `Authorization: Bearer $CRON_SECRET`. */
export const GET: RequestHandler = async ({ request }) => {
	if (!CRON_SECRET || request.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
		error(401, 'Unauthorized');
	}
	if (!driveConfigured()) return json({ skipped: 'GOOGLE_SERVICE_ACCOUNT_JSON is not set' });

	const results = await syncAllVisits();
	return json({
		visits: Object.keys(results).length,
		added: Object.values(results).reduce((sum, r) => sum + r.added, 0),
		missing: Object.values(results).reduce((sum, r) => sum + r.missing, 0),
		errors: Object.values(results).flatMap((r) => r.errors).length
	});
};
