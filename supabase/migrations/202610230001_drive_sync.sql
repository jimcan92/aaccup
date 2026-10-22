-- CTU Moalboal AACCUP — Google Drive folder sync
-- Run after 202610220001_visits.sql.
--
-- Each visit can point at one root Drive folder. Its subfolders are matched to sections
-- (or set by hand). The sync lists each section folder and keeps one document row per file:
-- * new files arrive as drafts (source = 'drive') for a focal person to publish;
-- * files that disappear are archived (hidden from the public) and flagged, not deleted;
-- * manual documents (source = 'manual') are never touched by the sync.
-- Only additive changes; existing rows keep source = 'manual'.

begin;

-- Drive file and folder ids: letters, digits, '-' and '_'.
alter table public.visits
	add column if not exists drive_root_folder_id text
		check (drive_root_folder_id ~ '^[A-Za-z0-9_-]{10,}$');

alter table public.areas
	add column if not exists drive_folder_id text
		check (drive_folder_id ~ '^[A-Za-z0-9_-]{10,}$'),
	-- 'auto' = matched from the visit root by name; 'manual' = set by an admin, never re-matched.
	add column if not exists drive_folder_source text not null default 'auto'
		check (drive_folder_source in ('auto', 'manual')),
	add column if not exists drive_folder_name text,
	add column if not exists drive_synced_at timestamptz;

alter table public.documents
	add column if not exists source text not null default 'manual'
		check (source in ('manual', 'drive')),
	add column if not exists drive_file_id text
		check (drive_file_id ~ '^[A-Za-z0-9_-]{10,}$'),
	-- The file name at the last sync. The title follows renames only while nobody edited it.
	add column if not exists drive_name text,
	-- True when "Anyone with the link" can view the file; null when unknown.
	add column if not exists drive_public boolean,
	-- True when the file is no longer in the section folder (row is archived, not deleted).
	add column if not exists drive_missing boolean not null default false;

alter table public.documents
	add constraint documents_drive_source_has_id check (source = 'manual' or drive_file_id is not null);

create unique index if not exists documents_area_drive_file
	on public.documents (area_id, drive_file_id) where drive_file_id is not null;

-- One row per sync run, for the admin's "last synced" line and troubleshooting.
create table if not exists public.drive_sync_runs (
	id uuid primary key default gen_random_uuid(),
	visit_id uuid references public.visits(id) on delete cascade,
	area_id uuid references public.areas(id) on delete cascade,
	trigger text not null check (trigger in ('manual', 'schedule')),
	actor uuid references public.profiles(id) on delete set null,
	started_at timestamptz not null default now(),
	finished_at timestamptz,
	added int not null default 0,
	updated int not null default 0,
	missing int not null default 0,
	not_public int not null default 0,
	errors jsonb not null default '[]'::jsonb
);

create index if not exists drive_sync_runs_visit on public.drive_sync_runs (visit_id, started_at desc);

alter table public.drive_sync_runs enable row level security;

-- Staff can read the log; only the server (service role) writes it.
drop policy if exists "staff read drive sync runs" on public.drive_sync_runs;
create policy "staff read drive sync runs" on public.drive_sync_runs
for select using (public.jwt_role() in ('admin', 'focal', 'reviewer', 'area_chair'));

commit;
