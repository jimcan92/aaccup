import type { SupabaseClient } from '@supabase/supabase-js';
import { formatFromMime, isFolder, listFolder, type DriveItem } from './drive';
import { groupScope, kindFromName, matchFolders, titleFromName, type MatchFolder, type MatchSection } from './drive-match';
import { supabaseService } from './sso';

/**
 * Drive → documents sync. Runs with the service-role client, so callers must check
 * permissions first (admin/focal for a visit, the section's editors for a section).
 *
 * Per section folder:
 *  - a new file becomes a draft document (source 'drive');
 *  - a known file updates its link, format, date, and access flag; its title follows
 *    a rename only while nobody has edited the title;
 *  - a file that left the folder is archived and flagged; if it comes back, it returns as a draft.
 * Manual documents are never touched.
 */

export type SyncTotals = { added: number; updated: number; missing: number; notPublic: number; errors: string[] };

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

const empty = (): SyncTotals => ({ added: 0, updated: 0, missing: 0, notPublic: 0, errors: [] });

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
	const seen = new Set<string>();

	for (const item of items) {
		seen.add(item.id);
		if (item.isPublic === false) totals.notPublic += 1;

		const shared = {
			drive_url: item.webViewLink,
			format: formatFromMime(item.mimeType),
			updated_label: item.modifiedTime.slice(0, 10),
			drive_public: item.isPublic,
			drive_name: item.name,
			drive_missing: false,
			status: 'linked'
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
				workflow: 'draft'
			});
			if (insertError) totals.errors.push(`${item.name}: ${insertError.message}`);
			else totals.added += 1;
			continue;
		}

		const titleUntouched = doc.drive_name !== null && doc.title === titleFromName(doc.drive_name);
		const { error: updateError } = await db
			.from('documents')
			.update({
				...shared,
				...(titleUntouched ? { title: isFolder(item) ? item.name : titleFromName(item.name) } : {}),
				// A file that came back needs another look before it is public again.
				...(doc.drive_missing ? { workflow: 'draft' } : {})
			})
			.eq('id', doc.id);
		if (updateError) totals.errors.push(`${item.name}: ${updateError.message}`);
		else totals.updated += 1;
	}

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

/** Re-match subfolders of the visit's root folder, then sync every section folder. */
export async function syncVisit(visitId: string, trigger: 'manual' | 'schedule', actor: string | null): Promise<SyncTotals> {
	const db = service();
	const totals = empty();
	const started = new Date().toISOString();

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
		totals.missing ? `${totals.missing} missing in Drive` : null,
		totals.notPublic ? `${totals.notPublic} not shared publicly` : null
	].filter(Boolean);
	const errors = totals.errors.length ? ` Problems: ${totals.errors.slice(0, 3).join('; ')}${totals.errors.length > 3 ? '…' : ''}` : '';
	return `Sync done: ${parts.join(', ')}.${errors}`;
}
