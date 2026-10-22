import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Tells the public home page whether to show the "Manage" link. The home page is cached
 * for everyone, so it asks here from the browser instead of rendering the link itself.
 * The hook has already resolved the SSO user and AACCUP profile for /admin paths.
 */
export const GET: RequestHandler = ({ locals }) =>
	json(
		{ staff: Boolean(locals.staff) },
		{ headers: { 'cache-control': 'private, no-store' } }
	);
