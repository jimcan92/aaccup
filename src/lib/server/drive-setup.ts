import type { SupabaseClient } from '@supabase/supabase-js';
import { driveConfigured, serviceAccountEmail } from './drive';

export type DriveSetup = Awaited<ReturnType<typeof loadDriveSetup>>;

/** Everything the Drive setup panel needs for one visit. */
export async function loadDriveSetup(supabase: SupabaseClient, visitId: string) {
	const [{ data: visit }, { data: areas }, { data: runs }] = await Promise.all([
		supabase
			.from('visits')
			.select('id, slug, year, label, status, drive_root_folder_id, program:programs(code)')
			.eq('id', visitId)
			.single(),
		supabase
			.from('areas')
			.select('id, kind, number, title, short_title, sort_order, drive_folder_id, drive_folder_name, drive_folder_source, drive_synced_at, documents(source, drive_public, drive_missing)')
			.eq('visit_id', visitId)
			.order('sort_order')
			.order('number'),
		supabase
			.from('drive_sync_runs')
			.select('started_at, trigger, added, updated, missing, not_public, errors')
			.eq('visit_id', visitId)
			.is('area_id', null)
			.order('started_at', { ascending: false })
			.limit(1)
	]);

	return {
		configured: driveConfigured(),
		email: serviceAccountEmail(),
		visit: visit
			? {
					id: visit.id as string,
					year: visit.year as number,
					label: visit.label as string,
					code: (visit.program as unknown as { code: string } | null)?.code ?? '',
					rootFolderId: visit.drive_root_folder_id as string | null
				}
			: null,
		sections: (areas ?? []).map((area) => ({
			id: area.id as string,
			kind: area.kind as string,
			number: area.number as number | null,
			title: area.title as string,
			short_title: area.short_title as string | null,
			folderId: area.drive_folder_id as string | null,
			folderName: area.drive_folder_name as string | null,
			folderSource: area.drive_folder_source as 'auto' | 'manual',
			syncedAt: area.drive_synced_at as string | null,
			fromDrive: area.documents.filter((document) => document.source === 'drive').length,
			issues: area.documents.filter((document) => document.drive_public === false || document.drive_missing).length
		})),
		lastRun: runs?.[0] ?? null
	};
}
