import { error } from '@sveltejs/kit';
import { driveFolderId } from '#lib/drive-url.js';
import { driveConfigured, isFolder, isFolderPath, listFolder } from '#lib/server/drive.js';
import { supabaseAnon } from '#lib/server/sso.js';
import type { FolderEntry } from '#lib/data/types.js';
import type { RequestHandler } from './$types';

export const prerender = false;


const ID = /^[\w-]{10,}$/;

/**
 * Contents of a published folder document, one level at a time, for the in-page folder browser.
 * ?doc=<document id> names the published document; ?path= (optional) leads to a subfolder inside it.
 * Only folders inside a published document can be listed, so this never exposes the rest of the
 * service account's Drive.
 */
export const GET: RequestHandler = async ({ url }) => {
	const doc = url.searchParams.get('doc') ?? '';
	// ?path=<id>,<id>,… : the subfolder chain from the document's folder down to the one to list.
	const path = (url.searchParams.get('path') ?? '').split(',').filter(Boolean);
	if (!/^[0-9a-f-]{36}$/i.test(doc) || path.length > 8 || !path.every((id) => ID.test(id))) error(400, 'Bad request');

	const db = supabaseAnon();
	if (!db || !driveConfigured()) error(503, 'Drive is not configured');

	// Row-level security returns published documents only.
	const { data: row } = await db.from('documents').select('drive_url').eq('id', doc).maybeSingle();
	const root = driveFolderId(row?.drive_url ?? undefined);
	if (!root) error(404, 'Folder not found');

	const folder = path.at(-1) ?? root;
	try {
		if (path.length && !(await isFolderPath(root, path))) error(404, 'Folder not found');
		const items = await listFolder(folder, { checkAccess: true });
		const entries: FolderEntry[] = items.map((item) => ({
			id: item.targetId ?? item.id,
			name: item.name,
			folder: isFolder(item),
			mimeType: item.mimeType,
			modified: item.modifiedTime.slice(0, 10),
			url: item.webViewLink,
			shared: item.isPublic
		}));
		return Response.json(entries, { headers: { 'cache-control': 'public, s-maxage=60, stale-while-revalidate=300' } });
	} catch (err) {
		if ((err as { status?: number }).status) throw err;
		error(502, 'Could not read the Drive folder');
	}
};
