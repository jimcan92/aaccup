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
 * service account's Drive. With ?preview=1 a signed-in staff member (resolved by the hook) can
 * list an unpublished folder document too, for review before publishing; that answer is not cached.
 * A document's shown_files narrows its top level to the chosen items (and the subfolders below
 * them); ?all=1 lifts that for staff, so the file picker in admin sees everything.
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	const doc = url.searchParams.get('doc') ?? '';
	// ?path=<id>,<id>,… : the subfolder chain from the document's folder down to the one to list.
	const path = (url.searchParams.get('path') ?? '').split(',').filter(Boolean);
	if (!/^[0-9a-f-]{36}$/i.test(doc) || path.length > 8 || !path.every((id) => ID.test(id))) error(400, 'Bad request');

	const staffPreview = url.searchParams.get('preview') === '1' && !!locals.staff && !!locals.supabase;
	const db = staffPreview ? locals.supabase : supabaseAnon();
	if (!db || !driveConfigured()) error(503, 'Drive is not configured');

	// Row-level security returns published documents only, or what the staff member may see.
	const { data: row } = await db.from('documents').select('drive_url, shown_files').eq('id', doc).maybeSingle();
	const root = driveFolderId(row?.drive_url ?? undefined);
	if (!root) error(404, 'Folder not found');

	const everything = staffPreview && url.searchParams.get('all') === '1';
	const shown = everything || !row?.shown_files ? null : new Set<string>(row.shown_files);
	// A subfolder that was not chosen stays closed too.
	if (shown && path.length && !shown.has(path[0])) error(404, 'Folder not found');

	const folder = path.at(-1) ?? root;
	try {
		if (path.length && !(await isFolderPath(root, path))) error(404, 'Folder not found');
		const listed = await listFolder(folder, { checkAccess: true });
		const items = shown && !path.length ? listed.filter((item) => shown.has(item.targetId ?? item.id)) : listed;
		const entries: FolderEntry[] = items.map((item) => ({
			id: item.targetId ?? item.id,
			name: item.name,
			folder: isFolder(item),
			mimeType: item.mimeType,
			modified: item.modifiedTime.slice(0, 10),
			url: item.webViewLink,
			shared: item.isPublic
		}));
		return Response.json(entries, {
			headers: { 'cache-control': staffPreview ? 'private, no-store' : 'public, s-maxage=60, stale-while-revalidate=300' }
		});
	} catch (err) {
		if ((err as { status?: number }).status) throw err;
		error(502, 'Could not read the Drive folder');
	}
};
