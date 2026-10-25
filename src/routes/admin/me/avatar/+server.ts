import { error, redirect } from '@sveltejs/kit';
import { fetchSsoImage } from '#lib/server/sso.js';
import type { RequestHandler } from './$types';

/**
 * The signed-in user's CTU Accounts photo as an image. Accounts stores uploads as data URLs,
 * which are too big to carry in cookies or page data; the browser caches this response instead.
 */
export const GET: RequestHandler = async ({ locals, request }) => {
	if (!locals.staff) error(401, 'Sign in first.');

	const image = await fetchSsoImage(request);
	const match = image?.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
	if (match) {
		return new Response(Buffer.from(match[2], 'base64'), {
			headers: { 'content-type': match[1], 'cache-control': 'private, max-age=600', 'x-content-type-options': 'nosniff' }
		});
	}
	if (image && /^https:\/\//.test(image)) redirect(302, image);
	error(404, 'No photo.');
};
