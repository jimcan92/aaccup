-- CTU Moalboal AACCUP 2026 — Supabase foundation
-- Run this once in the Supabase SQL Editor.
-- Public reads only published rows. Editors write through RLS.
-- The service-role key is never used in the browser.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

do $$ begin
	create type public.user_role as enum ('admin', 'focal', 'reviewer', 'area_chair');
exception when duplicate_object then null;
end $$;

do $$ begin
	create type public.workflow_status as enum ('draft', 'in_review', 'approved', 'published', 'archived');
exception when duplicate_object then null;
end $$;

do $$ begin
	create type public.area_kind as enum ('current', 'previous');
exception when duplicate_object then null;
end $$;

do $$ begin
	create type public.document_status as enum ('linked', 'pending');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Core content tables
-- ---------------------------------------------------------------------------

create table if not exists public.programs (
	id uuid primary key default gen_random_uuid(),
	code text not null unique,
	name text not null,
	degree text,
	visit_level text not null default 'Level III',
	status_label text not null default 'Level III visit',
	status_note text,
	survey_year int not null default 2026,
	previous_visit_label text,
	summary text,
	summary_title text,
	accent text,
	accent_soft text,
	accent_ink text,
	sort_order int not null default 0,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.areas (
	id uuid primary key default gen_random_uuid(),
	program_id uuid not null references public.programs(id) on delete cascade,
	kind public.area_kind not null,
	number int not null,
	slug text not null,
	title text not null,
	short_title text,
	description text,
	focus text,
	sort_order int not null default 0,
	status public.workflow_status not null default 'draft',
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (program_id, kind, slug),
	unique (program_id, kind, number)
);

create table if not exists public.documents (
	id uuid primary key default gen_random_uuid(),
	area_id uuid not null references public.areas(id) on delete cascade,
	title text not null,
	kind text not null,
	format text not null default 'pdf',
	drive_url text,
	status public.document_status not null default 'pending',
	updated_label text,
	note text,
	sort_order int not null default 0,
	workflow public.workflow_status not null default 'draft',
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

-- Editable site copy, VMGO, hero text, carousel. One row per block.
-- draft_value is what the focal person edits; published_value is what the site reads.
create table if not exists public.content_blocks (
	id uuid primary key default gen_random_uuid(),
	key text not null unique,
	label text not null,
	group_name text not null default 'Site',
	type text not null default 'text' check (type in ('text', 'textarea', 'url', 'image', 'json')),
	draft_value text,
	published_value text,
	status public.workflow_status not null default 'draft',
	sort_order int not null default 0,
	updated_by uuid,
	reviewed_by uuid,
	updated_at timestamptz not null default now(),
	published_at timestamptz
);

create table if not exists public.profiles (
	id uuid primary key references auth.users(id) on delete cascade,
	email text not null,
	full_name text,
	role public.user_role not null default 'area_chair',
	program_id uuid references public.programs(id) on delete set null,
	area_id uuid references public.areas(id) on delete set null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.revisions (
	id uuid primary key default gen_random_uuid(),
	entity text not null,
	entity_id uuid,
	snapshot jsonb not null,
	action text not null,
	actor uuid references public.profiles(id) on delete set null,
	created_at timestamptz not null default now()
);

create table if not exists public.publish_log (
	id uuid primary key default gen_random_uuid(),
	entity text not null,
	entity_id uuid,
	summary text,
	actor uuid references public.profiles(id) on delete set null,
	created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

drop trigger if exists programs_touch on public.programs;
create trigger programs_touch before update on public.programs
for each row execute function public.touch_updated_at();

drop trigger if exists areas_touch on public.areas;
create trigger areas_touch before update on public.areas
for each row execute function public.touch_updated_at();

drop trigger if exists documents_touch on public.documents;
create trigger documents_touch before update on public.documents
for each row execute function public.touch_updated_at();

drop trigger if exists content_blocks_touch on public.content_blocks;
create trigger content_blocks_touch before update on public.content_blocks
for each row execute function public.touch_updated_at();

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Helpers: read role and program from the JWT app_metadata.
-- This avoids recursive RLS lookups on profiles.
-- ---------------------------------------------------------------------------

create or replace function public.jwt_role()
returns text
language sql
stable
as $$
	select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'anon');
$$;

create or replace function public.jwt_program_id()
returns uuid
language sql
stable
as $$
	select nullif(auth.jwt() -> 'app_metadata' ->> 'program_id', '')::uuid;
$$;

-- ---------------------------------------------------------------------------
-- New auth user -> profile
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	insert into public.profiles (id, email, full_name, role)
	values (
		new.id,
		new.email,
		coalesce(new.raw_user_meta_data ->> 'full_name', ''),
		'area_chair'
	)
	on conflict (id) do nothing;

	return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.programs enable row level security;
alter table public.areas enable row level security;
alter table public.documents enable row level security;
alter table public.content_blocks enable row level security;
alter table public.profiles enable row level security;
alter table public.revisions enable row level security;
alter table public.publish_log enable row level security;

-- Public: read published only.
drop policy if exists "public read programs" on public.programs;
create policy "public read programs" on public.programs
for select using (true);

drop policy if exists "public read published areas" on public.areas;
create policy "public read published areas" on public.areas
for select using (status = 'published');

drop policy if exists "public read published documents" on public.documents;
create policy "public read published documents" on public.documents
for select using (workflow = 'published');

drop policy if exists "public read published blocks" on public.content_blocks;
create policy "public read published blocks" on public.content_blocks
for select using (status = 'published');

-- Admin and focal: full read/write on content.
drop policy if exists "admin focal manage programs" on public.programs;
create policy "admin focal manage programs" on public.programs
for all using (public.jwt_role() in ('admin', 'focal'))
with check (public.jwt_role() in ('admin', 'focal'));

drop policy if exists "admin focal manage areas" on public.areas;
create policy "admin focal manage areas" on public.areas
for all using (public.jwt_role() in ('admin', 'focal'))
with check (public.jwt_role() in ('admin', 'focal'));

drop policy if exists "admin focal manage documents" on public.documents;
create policy "admin focal manage documents" on public.documents
for all using (public.jwt_role() in ('admin', 'focal'))
with check (public.jwt_role() in ('admin', 'focal'));

drop policy if exists "admin focal manage blocks" on public.content_blocks;
create policy "admin focal manage blocks" on public.content_blocks
for all using (public.jwt_role() in ('admin', 'focal'))
with check (public.jwt_role() in ('admin', 'focal'));

-- Reviewer: read everything, write nothing.
drop policy if exists "reviewer read areas" on public.areas;
create policy "reviewer read areas" on public.areas
for select using (public.jwt_role() = 'reviewer');

drop policy if exists "reviewer read documents" on public.documents;
create policy "reviewer read documents" on public.documents
for select using (public.jwt_role() = 'reviewer');

drop policy if exists "reviewer read blocks" on public.content_blocks;
create policy "reviewer read blocks" on public.content_blocks
for select using (public.jwt_role() = 'reviewer');

-- Area chair: read all content in their program, write areas/documents only.
drop policy if exists "area chair read areas" on public.areas;
create policy "area chair read areas" on public.areas
for select using (
	public.jwt_role() = 'area_chair'
	and program_id = public.jwt_program_id()
);

drop policy if exists "area chair update areas" on public.areas;
create policy "area chair update areas" on public.areas
for update using (
	public.jwt_role() = 'area_chair'
	and program_id = public.jwt_program_id()
)
with check (
	public.jwt_role() = 'area_chair'
	and program_id = public.jwt_program_id()
);

drop policy if exists "area chair read documents" on public.documents;
create policy "area chair read documents" on public.documents
for select using (
	public.jwt_role() = 'area_chair'
	and exists (
		select 1 from public.areas a
		where a.id = documents.area_id
		and a.program_id = public.jwt_program_id()
	)
);

drop policy if exists "area chair manage documents" on public.documents;
create policy "area chair manage documents" on public.documents
for all using (
	public.jwt_role() = 'area_chair'
	and exists (
		select 1 from public.areas a
		where a.id = documents.area_id
		and a.program_id = public.jwt_program_id()
	)
)
with check (
	public.jwt_role() = 'area_chair'
	and exists (
		select 1 from public.areas a
		where a.id = documents.area_id
		and a.program_id = public.jwt_program_id()
	)
);

-- Profiles: users see themselves; admin/focal see all; admin can update roles.
drop policy if exists "profiles read self" on public.profiles;
create policy "profiles read self" on public.profiles
for select using (id = auth.uid());

drop policy if exists "profiles read admin focal" on public.profiles;
create policy "profiles read admin focal" on public.profiles
for select using (public.jwt_role() in ('admin', 'focal'));

drop policy if exists "profiles update self name" on public.profiles;
create policy "profiles update self name" on public.profiles
for update using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "profiles admin manage" on public.profiles;
create policy "profiles admin manage" on public.profiles
for all using (public.jwt_role() = 'admin')
with check (public.jwt_role() = 'admin');

-- Revisions and publish log: staff read; editors insert.
drop policy if exists "staff read revisions" on public.revisions;
create policy "staff read revisions" on public.revisions
for select using (public.jwt_role() in ('admin', 'focal', 'reviewer', 'area_chair'));

drop policy if exists "staff write revisions" on public.revisions;
create policy "staff write revisions" on public.revisions
for insert with check (public.jwt_role() in ('admin', 'focal', 'area_chair'));

drop policy if exists "staff read publish log" on public.publish_log;
create policy "staff read publish log" on public.publish_log
for select using (public.jwt_role() in ('admin', 'focal', 'reviewer'));

drop policy if exists "staff write publish log" on public.publish_log;
create policy "staff write publish log" on public.publish_log
for insert with check (public.jwt_role() in ('admin', 'focal'));

-- ---------------------------------------------------------------------------
-- Storage: public read, editors write
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
	'public-images',
	'public-images',
	true,
	5242880,
	array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
	public = excluded.public,
	file_size_limit = excluded.file_size_limit,
	allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read public images" on storage.objects;
create policy "public read public images" on storage.objects
for select using (bucket_id = 'public-images');

drop policy if exists "editors upload public images" on storage.objects;
create policy "editors upload public images" on storage.objects
for insert to authenticated with check (
	bucket_id = 'public-images'
	and public.jwt_role() in ('admin', 'focal', 'area_chair')
);

drop policy if exists "editors update public images" on storage.objects;
create policy "editors update public images" on storage.objects
for update to authenticated using (
	bucket_id = 'public-images'
	and public.jwt_role() in ('admin', 'focal', 'area_chair')
);

drop policy if exists "editors delete public images" on storage.objects;
create policy "editors delete public images" on storage.objects
for delete to authenticated using (
	bucket_id = 'public-images'
	and public.jwt_role() in ('admin', 'focal')
);

-- ---------------------------------------------------------------------------
-- Seed: editable copy, VMGO, carousel.
-- Safe to rerun; existing values are preserved.
-- ---------------------------------------------------------------------------

insert into public.content_blocks (key, label, group_name, type, draft_value, published_value, status, sort_order)
values
	('site.title', 'Site title', 'Site', 'text', 'AACCUP 2026 · CTU Moalboal', 'AACCUP 2026 · CTU Moalboal', 'published', 10),
	('site.description', 'Site description', 'Site', 'textarea',
		'The BSIE and BSFI dossiers for the AACCUP Level III visit at Cebu Technological University — Moalboal Campus. Current visit areas, previous-visit recommendations, and shared records, linked to Google Drive.',
		'The BSIE and BSFI dossiers for the AACCUP Level III visit at Cebu Technological University — Moalboal Campus. Current visit areas, previous-visit recommendations, and shared records, linked to Google Drive.',
		'published', 20),
	('site.intro', 'Home intro', 'Site', 'textarea',
		'Choose the BSIE or BSFI dossier. Each volume carries its own current visit, its previous 10-area recommendations, and its record of evidence.',
		'Choose the BSIE or BSFI dossier. Each volume carries its own current visit, its previous 10-area recommendations, and its record of evidence.',
		'published', 30),
	('site.status_note', 'Visit status note', 'Site', 'text', 'Applying for Level III accreditation', 'Applying for Level III accreditation', 'published', 40),
	('site.contact_note', 'Contact note', 'Site', 'textarea',
		'For corrections, missing links, or access concerns, coordinate with the Campus AACCUP Task Force through the Office of the Campus Director.',
		'For corrections, missing links, or access concerns, coordinate with the Campus AACCUP Task Force through the Office of the Campus Director.',
		'published', 50),
	('site.address', 'Campus address', 'Campus', 'text', 'Poblacion West, Moalboal, Cebu 6032', 'Poblacion West, Moalboal, Cebu 6032', 'published', 10),
	('site.phone', 'Campus phone', 'Campus', 'text', '(032) 474-8196 loc. 1602', '(032) 474-8196 loc. 1602', 'published', 20),
	('site.email', 'Campus email', 'Campus', 'text', 'cdmoalboal@ctu.edu.ph', 'cdmoalboal@ctu.edu.ph', 'published', 30),
	('home.hero.title', 'Hero title', 'Home', 'text', 'Two volumes. One campus.', 'Two volumes. One campus.', 'published', 10),
	('home.hero.intro', 'Hero intro', 'Home', 'textarea',
		'Choose the BSIE or BSFI dossier. Each volume carries its own current visit, its previous 10-area recommendations, and its record of evidence.',
		'Choose the BSIE or BSFI dossier. Each volume carries its own current visit, its previous 10-area recommendations, and its record of evidence.',
		'published', 20),
	('vmgo.vision', 'University vision', 'VMGO', 'textarea',
		'CTU as a premier, inclusive, globally recognized research and innovation, smart, community-responsive, and sustainable technological university.',
		'CTU as a premier, inclusive, globally recognized research and innovation, smart, community-responsive, and sustainable technological university.',
		'published', 10),
	('vmgo.mission', 'University mission', 'VMGO', 'textarea',
		'The University shall primarily provide learning-edge degree programs, innovative, professional, entrepreneurial, and technical instruction as well as research, extension and resource generation programs that address both the needs of the region and the nation in the context of the global knowledge economy, Fifth Industrial Revolution, and sustainability.',
		'The University shall primarily provide learning-edge degree programs, innovative, professional, entrepreneurial, and technical instruction as well as research, extension and resource generation programs that address both the needs of the region and the nation in the context of the global knowledge economy, Fifth Industrial Revolution, and sustainability.',
		'published', 20),
	('vmgo.source', 'VMGO source URL', 'VMGO', 'url', 'https://www.ctu.edu.ph/moalboal/about/vmgo/', 'https://www.ctu.edu.ph/moalboal/about/vmgo/', 'published', 30),
	('home.carousel', 'Carousel slides', 'Home', 'json',
		'[{"src":"https://www.ctu.edu.ph/moalboal/wp-content/uploads/sites/47/2026/04/4-1300x869.png","alt":"CTU Moalboal strategic planning orientation","caption":"Charting the path to 2030","meta":"University strategic planning · April 2026"},{"src":"https://www.ctu.edu.ph/moalboal/wp-content/uploads/sites/47/2026/03/Copy-of-Untitled-1.png","alt":"CTU Moalboal delegates at the SUGBOHOL 2026 solidarity meeting","caption":"SUGBOHOL 2026 solidarity meeting","meta":"Regional assembly · March 2026"},{"src":"https://www.ctu.edu.ph/moalboal/wp-content/uploads/sites/47/2025/08/3-14.png","alt":"Recognition Day and stakeholders engagement at CTU Moalboal","caption":"Recognition Day and stakeholders’ engagement","meta":"Campus honors and partnerships · August 2025"}]',
		'[{"src":"https://www.ctu.edu.ph/moalboal/wp-content/uploads/sites/47/2026/04/4-1300x869.png","alt":"CTU Moalboal strategic planning orientation","caption":"Charting the path to 2030","meta":"University strategic planning · April 2026"},{"src":"https://www.ctu.edu.ph/moalboal/wp-content/uploads/sites/47/2026/03/Copy-of-Untitled-1.png","alt":"CTU Moalboal delegates at the SUGBOHOL 2026 solidarity meeting","caption":"SUGBOHOL 2026 solidarity meeting","meta":"Regional assembly · March 2026"},{"src":"https://www.ctu.edu.ph/moalboal/wp-content/uploads/sites/47/2025/08/3-14.png","alt":"Recognition Day and stakeholders engagement at CTU Moalboal","caption":"Recognition Day and stakeholders’ engagement","meta":"Campus honors and partnerships · August 2025"}]',
		'published', 30)
on conflict (key) do nothing;
