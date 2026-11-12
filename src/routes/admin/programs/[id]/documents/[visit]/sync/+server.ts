import { error, json } from '@sveltejs/kit';
import { requireStaff } from '#lib/server/admin.js';
import { driveConfigured } from '#lib/server/drive.js';
import { finishVisitSync, startVisitSync, summary, syncVisitSection, type SyncTotals } from '#lib/server/drive-sync.js';
import type { RequestHandler } from './$types';

export const prerender = false;

type Body =
	| { step: 'start' }
	| { step: 'section'; area: string }
	| { step: 'finish'; started: string; totals: SyncTotals };

/**
 * Manual Drive sync in steps, so the admin sees progress: start (match folders, list sections),
 * section (one at a time), finish (log the run). Admin and focal only, like the Sync now action.
 */
export const POST: RequestHandler = async ({ locals, params, request }) => {
	const { staff } = requireStaff(locals, ['admin', 'focal']);
	if (!driveConfigured()) error(400, 'Google Drive is not configured on this deployment (GOOGLE_SERVICE_ACCOUNT_JSON).');

	const body = (await request.json()) as Body;
	if (body.step === 'start') return json(await startVisitSync(params.visit));
	if (body.step === 'section') return json(await syncVisitSection(params.visit, body.area));
	if (body.step === 'finish') {
		await finishVisitSync(params.visit, staff.id, body.started, body.totals);
		return json({ message: summary(body.totals) });
	}
	error(400, 'Unknown step');
};
