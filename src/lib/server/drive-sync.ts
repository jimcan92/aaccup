import type { SupabaseClient } from '@supabase/supabase-js';
import { folderHasFiles, formatFromMime, isFolder, listFolder, type DriveItem } from './drive';
import { groupScope, kindFromName, matchFolders, titleFromName, type MatchFolder, type MatchSection } from './drive-match';
import { supabaseService } from './sso';

/**
 * Drive → documents sync. Runs with the service-role client, so callers must check
 * permissions first (admin/focal for a visit, the section's editors for a section).
 *
 * Per section folder:
 *  - a new file is published straight away (source 'drive'): what is in Drive is on the site;
 *  - a folder with no files in it (an empty placeholder) is kept as "pending", not linked;
 *  - a known file updates its link, format, date, and access flag; its title follows
 *    a rename only while nobody has edited the title;
 *  - a file that left the folder is archived and flagged; if it comes back, it is published again.
 * Manual documents are never touched.
 */

export type SyncTotals = {
	added: number;
	updated: number;
	missing: number;
	notPublic: number;
	/** Folders with no files in them yet (kept as "In preparation"). */
	emptyFolders: number;
	errors: string[];
};

type AreaRow = MatchSection & {
	slug: string;
	visit_id: string;
	drive_folder_id: string | null;
	drive_folder_source: 'auto' | 'manual';
};

type DriveDoc = {
	id: string;
	title: string;
	drive_file_id: string;
	drive_name: string | null;
	drive_missing: boolean;
	workflow: string;
	sort_order: number;
};

const empty = (): SyncTotals => ({ added: 0, updated: 0, missing: 0, notPublic: 0, emptyFolders: 0, errors: [] });

export function addTotals(into: SyncTotals, from: SyncTotals) {
	into.added += from.added;
	into.updated += from.updated;
	into.missing += from.missing;
	into.notPublic += from.notPublic;
	into.emptyFolders += from.emptyFolders;
	into.errors.push(...from.errors);
}

/** Runs `task` over `items` with at most `limit` running at once. */
async function eachLimit<T>(items: T[], limit: number, task: (item: T) => Promise<void>) {
	let next = 0;
	const worker = async () => {
		while (next < items.length) await task(items[next++]);
	};
	await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

function service(): SupabaseClient {
	const client = supabaseService();
	if (!client) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set.');
	return client;
}

async function syncAreaFolder(db: SupabaseClient, area: AreaRow, totals: SyncTotals) {
	if (!area.drive_folder_id) return;

	let items: DriveItem[];
	try {
		items = await listFolder(area.drive_folder_id, { checkAccess: true });
	} catch (err) {
		totals.errors.push(`${area.title}: ${(err as Error).message}`);
		return;
	}

	const { data: existing, error } = await db
		.from('documents')
		.select('id, title, drive_file_id, drive_name, drive_missing, workflow, sort_order')
		.eq('area_id', area.id)
		.eq('source', 'drive');
	if (error) {
		totals.errors.push(`${area.title}: ${error.message}`);
		return;
	}

	const known = new Map((existing as DriveDoc[]).map((doc) => [doc.drive_file_id, doc]));
	const { data: last } = await db
		.from('documents')
		.select('sort_order')
		.eq('area_id', area.id)
		.order('sort_order', { ascending: false })
		.limit(1);
	let nextSort = (last?.[0]?.sort_order ?? -1) + 1;
	const seen = new Set(items.map((item) => item.id));

	// An empty placeholder folder keeps its link but stays "In preparation" until files land in it.
	// Folder checks and row writes run a few at a time: one after another is too slow for big areas.
	const hasFiles = new Map<string, boolean>();
	await eachLimit(items.filter(isFolder), 8, async (item) => {
		try {
			const filled = await folderHasFiles(item.targetId ?? item.id);
			hasFiles.set(item.id, filled);
			if (!filled) totals.emptyFolders += 1;
		} catch (err) {
			totals.errors.push(`${item.name}: ${(err as Error).message}`);
		}
	});

	await eachLimit(items, 8, async (item) => {
		if (item.isPublic === false) totals.notPublic += 1;
		const hasContent = hasFiles.get(item.id) ?? true;

		const shared = {
			drive_url: item.webViewLink,
			format: formatFromMime(item.mimeType),
			updated_label: item.modifiedTime.slice(0, 10),
			drive_public: item.isPublic,
			drive_name: item.name,
			drive_missing: false,
			status: hasContent ? 'linked' : 'pending'
		};
		const doc = known.get(item.id);

		if (!doc) {
			const { error: insertError } = await db.from('documents').insert({
				...shared,
				area_id: area.id,
				source: 'drive',
				drive_file_id: item.id,
				title: isFolder(item) ? item.name : titleFromName(item.name),
				kind: kindFromName(item.name, area.kind),
				sort_order: nextSort++,
				workflow: 'published'
			});
			if (insertError) totals.errors.push(`${item.name}: ${insertError.message}`);
			else totals.added += 1;
			return;
		}

		const titleUntouched = doc.drive_name !== null && doc.title === titleFromName(doc.drive_name);
		const { error: updateError } = await db
			.from('documents')
			.update({
				...shared,
				...(titleUntouched ? { title: isFolder(item) ? item.name : titleFromName(item.name) } : {}),
				// Drive is the source of truth: drafts and files that came back are published.
				// Items a reviewer has in review, approved, or archived by hand are left alone.
				...(doc.drive_missing || doc.workflow === 'draft' ? { workflow: 'published' } : {})
			})
			.eq('id', doc.id);
		if (updateError) totals.errors.push(`${item.name}: ${updateError.message}`);
		else totals.updated += 1;
	});

	const gone = (existing as DriveDoc[]).filter((doc) => !seen.has(doc.drive_file_id) && !doc.drive_missing);
	if (gone.length) {
		const { error: missingError } = await db
			.from('documents')
			.update({ drive_missing: true, workflow: 'archived' })
			.in('id', gone.map((doc) => doc.id));
		if (missingError) totals.errors.push(`${area.title}: ${missingError.message}`);
		else totals.missing += gone.length;
	}

	await db.from('areas').update({ drive_synced_at: new Date().toISOString() }).eq('id', area.id);
}

async function logRun(
	db: SupabaseClient,
	run: { visit_id: string | null; area_id: string | null; trigger: 'manual' | 'schedule'; actor: string | null; started: string },
	totals: SyncTotals
) {
	await db.from('drive_sync_runs').insert({
		visit_id: run.visit_id,
		area_id: run.area_id,
		trigger: run.trigger,
		actor: run.actor,
		started_at: run.started,
		finished_at: new Date().toISOString(),
		added: totals.added,
		updated: totals.updated,
		missing: totals.missing,
		not_public: totals.notPublic,
		errors: totals.errors
	});
}

const AREA_FIELDS = 'id, visit_id, kind, number, slug, title, short_title, drive_folder_id, drive_folder_source';

/** Re-match subfolders of the visit's root folder to its sections. Returns the sections in order. */
async function matchVisitFolders(db: SupabaseClient, visitId: string, totals: SyncTotals): Promise<AreaRow[]> {
	const { data: visit } = await db.from('visits').select('id, drive_root_folder_id').eq('id', visitId).single();
	const { data: areaRows } = await db.from('areas').select(AREA_FIELDS).eq('visit_id', visitId).order('sort_order');
	const areas = (areaRows ?? []) as AreaRow[];

	if (visit?.drive_root_folder_id) {
		try {
			const folders = (await listFolder(visit.drive_root_folder_id)).filter(isFolder);
			// Group folders ("01 Evidence – 2022 Findings Compliance", "02 Evidence – Level III
			// Documents", "Previous visit") hold the section folders one level down.
			const candidates: MatchFolder[] = [];
			for (const folder of folders) {
				const scope = groupScope(folder.name);
				if (!scope) {
					candidates.push({ id: folder.id, name: folder.name, scope: 'any' });
					continue;
				}
				for (const child of (await listFolder(folder.id)).filter(isFolder)) {
					candidates.push({ id: child.id, name: child.name, scope });
				}
			}

			const auto = areas.filter((area) => area.drive_folder_source === 'auto');
			const matches = matchFolders(auto, candidates);

			for (const area of auto) {
				const folder = matches.get(area.id) ?? null;
				if ((folder?.id ?? null) === area.drive_folder_id) continue;
				await db
					.from('areas')
					.update({ drive_folder_id: folder?.id ?? null, drive_folder_name: folder?.name ?? null })
					.eq('id', area.id);
				area.drive_folder_id = folder?.id ?? null;
			}
		} catch (err) {
			totals.errors.push(`Root folder: ${(err as Error).message}`);
		}
	}

	return areas;
}

export type SyncStep = { id: string; label: string; hasFolder: boolean };

const stepLabel = (area: AreaRow) =>
	area.kind === 'previous' && area.number ? `Area ${area.number} · ${area.short_title || area.title}` : area.short_title || area.title;

/**
 * Step 1 of a manual visit sync shown with progress: match folders and list the sections to sync.
 * The browser then calls syncVisitSection for each section and finishVisitSync at the end, so
 * every request stays short and the admin sees which section is running.
 */
export async function startVisitSync(visitId: string): Promise<{ steps: SyncStep[]; totals: SyncTotals }> {
	const totals = empty();
	const areas = await matchVisitFolders(service(), visitId, totals);
	return { steps: areas.map((area) => ({ id: area.id, label: stepLabel(area), hasFolder: !!area.drive_folder_id })), totals };
}

/** Step 2: sync one section of the visit, without logging a run of its own. */
export async function syncVisitSection(visitId: string, areaId: string): Promise<SyncTotals> {
	const db = service();
	const totals = empty();
	const { data: area } = await db.from('areas').select(AREA_FIELDS).eq('id', areaId).eq('visit_id', visitId).single();
	if (!area) return { ...totals, errors: ['Section not found.'] };
	await syncAreaFolder(db, area as AreaRow, totals);
	return totals;
}

/** Step 3: record the whole run once, like the one-shot sync does. */
export async function finishVisitSync(visitId: string, actor: string | null, started: string, totals: SyncTotals) {
	await logRun(service(), { visit_id: visitId, area_id: null, trigger: 'manual', actor, started }, totals);
}

/** Re-match subfolders of the visit's root folder, then sync every section folder (scheduled runs). */
export async function syncVisit(visitId: string, trigger: 'manual' | 'schedule', actor: string | null): Promise<SyncTotals> {
	const db = service();
	const totals = empty();
	const started = new Date().toISOString();

	const areas = await matchVisitFolders(db, visitId, totals);
	for (const area of areas) await syncAreaFolder(db, area, totals);

	await logRun(db, { visit_id: visitId, area_id: null, trigger, actor, started }, totals);
	return totals;
}

export async function syncArea(areaId: string, actor: string | null): Promise<SyncTotals> {
	const db = service();
	const totals = empty();
	const started = new Date().toISOString();

	const { data: area } = await db.from('areas').select(AREA_FIELDS).eq('id', areaId).single();
	if (!area) return { ...totals, errors: ['Section not found.'] };
	if (!area.drive_folder_id) return { ...totals, errors: ['This section has no Drive folder yet.'] };

	await syncAreaFolder(db, area as AreaRow, totals);
	await logRun(db, { visit_id: area.visit_id, area_id: areaId, trigger: 'manual', actor, started }, totals);
	return totals;
}

/** Scheduled run: every visit that has a root folder or any section folder. */
export async function syncAllVisits(): Promise<Record<string, SyncTotals>> {
	const db = service();
	const { data: rootVisits } = await db.from('visits').select('id').not('drive_root_folder_id', 'is', null);
	const { data: folderAreas } = await db.from('areas').select('visit_id').not('drive_folder_id', 'is', null);
	const ids = new Set([...(rootVisits ?? []).map((v) => v.id), ...(folderAreas ?? []).map((a) => a.visit_id)]);

	const results: Record<string, SyncTotals> = {};
	for (const id of ids) results[id] = await syncVisit(id, 'schedule', null);
	return results;
}

export function summary(totals: SyncTotals): string {
	const parts = [
		`${totals.added} new`,
		`${totals.updated} checked`,
		totals.emptyFolders ? `${totals.emptyFolders} empty ${totals.emptyFolders === 1 ? 'folder' : 'folders'}` : null,
		totals.missing ? `${totals.missing} missing in Drive` : null,
		totals.notPublic ? `${totals.notPublic} not shared publicly` : null
	].filter(Boolean);
	const errors = totals.errors.length ? ` Problems: ${totals.errors.slice(0, 3).join('; ')}${totals.errors.length > 3 ? '…' : ''}` : '';
	return `Sync done: ${parts.join(', ')}.${errors}`;
}
