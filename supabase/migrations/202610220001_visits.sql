-- CTU Moalboal AACCUP — visits, common sections, program themes
-- Run after 202610210003_public_content_security.sql.
--
-- Programs -> visits -> areas (sections) -> documents.
-- * A visit is one survey of one program (year + level). One visit per program is active.
-- * Areas belong to a visit. kind = common | current | previous.
--   Common documents (Certification, BOR, COPC, Checklist, Additional) are their own rows
--   per program and per visit, never shared.
-- * Public reads go through published_programs() and published_dossier(), published rows only.
--
-- Precondition: public.areas and public.documents are empty (checked below).
-- The whole script runs in one transaction; any failure leaves the database unchanged.

begin;

do $$
begin
	if exists (select 1 from public.areas) or exists (select 1 from public.documents) then
		raise exception 'areas/documents already have rows; this migration expects them empty';
	end if;
end $$;

-- ---------------------------------------------------------------------------
-- Programs: URL slug and theme colors
-- ---------------------------------------------------------------------------

alter table public.programs
	add column if not exists slug text,
	add column if not exists theme_contrast text not null default '#ffffff';

alter table public.programs rename column accent to theme_program;
alter table public.programs rename column accent_soft to theme_soft;
alter table public.programs rename column accent_ink to theme_ink;

update public.programs set slug = lower(code) where slug is null;

alter table public.programs
	alter column slug set not null,
	add constraint programs_slug_key unique (slug),
	add constraint programs_slug_format check (slug ~ '^[a-z][a-z0-9-]*$'),
	add constraint programs_theme_hex check (
		coalesce(theme_program, '#000000') ~* '^#[0-9a-f]{6}$'
		and coalesce(theme_soft, '#000000') ~* '^#[0-9a-f]{6}$'
		and coalesce(theme_ink, '#000000') ~* '^#[0-9a-f]{6}$'
		and theme_contrast ~* '^#[0-9a-f]{6}$'
	);

-- Visit-specific columns move to public.visits. They stay on programs, unused,
-- until the site reads from visits; a later migration drops them.
comment on column public.programs.visit_level is 'Deprecated: use visits.level';
comment on column public.programs.status_label is 'Deprecated: use visits.label';
comment on column public.programs.survey_year is 'Deprecated: use visits.year';
comment on column public.programs.previous_visit_label is 'Deprecated: use visits.previous_label';

-- ---------------------------------------------------------------------------
-- Visits
-- ---------------------------------------------------------------------------

do $$ begin
	create type public.visit_status as enum ('active', 'archived');
exception when duplicate_object then null;
end $$;

create table if not exists public.visits (
	id uuid primary key default gen_random_uuid(),
	program_id uuid not null references public.programs(id) on delete cascade,
	slug text not null check (slug ~ '^[0-9]{4}(-[a-z0-9]+)*$'),
	year int not null check (year between 1980 and 2100),
	level text not null,
	-- Public wording. Keep "Level III visit"; never "accredited" unless official.
	label text not null,
	-- Which survey the previous-visit areas came from, e.g. "2024 survey".
	previous_label text,
	status public.visit_status not null default 'archived',
	workflow public.workflow_status not null default 'draft',
	sort_order int not null default 0,
	updated_by uuid references public.profiles(id) on delete set null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (program_id, slug)
);

-- At most one active visit per program; /[program] shows it.
create unique index if not exists visits_one_active_per_program
	on public.visits (program_id) where status = 'active';

drop trigger if exists visits_touch_updated_at on public.visits;
create trigger visits_touch_updated_at before update on public.visits
for each row execute function public.touch_updated_at();

drop trigger if exists visits_updated_by on public.visits;
create trigger visits_updated_by before update on public.visits
for each row execute function public.set_updated_by();

-- ---------------------------------------------------------------------------
-- Areas become sections of a visit
-- ---------------------------------------------------------------------------

-- kind: enum -> text + check, so 'common' can be added and used in one transaction.
alter table public.areas drop constraint if exists areas_program_id_kind_slug_key;
alter table public.areas drop constraint if exists areas_program_id_kind_number_key;
alter table public.areas alter column kind type text using kind::text;
drop type if exists public.area_kind;

alter table public.areas
	add column visit_id uuid not null references public.visits(id) on delete cascade,
	alter column number drop not null,
	add constraint areas_kind_check check (kind in ('common', 'current', 'previous')),
	-- Slugs share the URL space with routes and visit slugs.
	add constraint areas_slug_format check (
		slug ~ '^[a-z][a-z0-9-]*$'
		and slug not in ('documents', 'visit', 'areas', 'records', 'about')
	),
	add constraint areas_visit_slug_key unique (visit_id, slug);

create unique index if not exists areas_visit_kind_number
	on public.areas (visit_id, kind, number) where number is not null;

create index if not exists areas_visit_id on public.areas (visit_id);
create index if not exists documents_area_id on public.documents (area_id);

-- areas.program_id stays (RLS for area chairs uses it); keep it equal to the visit's program.
create or replace function public.areas_sync_program()
returns trigger
language plpgsql
as $$
begin
	select v.program_id into new.program_id from public.visits v where v.id = new.visit_id;
	return new;
end;
$$;

drop trigger if exists areas_sync_program on public.areas;
create trigger areas_sync_program before insert or update of visit_id, program_id on public.areas
for each row execute function public.areas_sync_program();

-- A linked document must have a link.
alter table public.documents
	add constraint documents_linked_has_url check (status = 'pending' or drive_url is not null),
	add constraint documents_format_check check (format in ('pdf', 'docx', 'xlsx', 'pptx', 'folder', 'link')),
	add constraint documents_kind_check check (
		kind in ('recommendation', 'compliance', 'narrative', 'supporting', 'checklist', 'presentation', 'institutional', 'form')
	);

-- ---------------------------------------------------------------------------
-- Area chairs: limit to one area when profiles.area_id is set
-- ---------------------------------------------------------------------------

create or replace function public.jwt_area_id()
returns uuid
language sql
stable
as $$
	select nullif(auth.jwt() -> 'app_metadata' ->> 'area_id', '')::uuid;
$$;

drop policy if exists "area chair update areas" on public.areas;
create policy "area chair update areas" on public.areas
for update using (
	public.jwt_role() = 'area_chair'
	and program_id = public.jwt_program_id()
	and (public.jwt_area_id() is null or id = public.jwt_area_id())
)
with check (
	public.jwt_role() = 'area_chair'
	and program_id = public.jwt_program_id()
	and (public.jwt_area_id() is null or id = public.jwt_area_id())
);

drop policy if exists "area chair insert documents" on public.documents;
create policy "area chair insert documents" on public.documents
for insert with check (
	public.jwt_role() = 'area_chair'
	and exists (
		select 1 from public.areas a
		where a.id = documents.area_id
		and a.program_id = public.jwt_program_id()
		and (public.jwt_area_id() is null or a.id = public.jwt_area_id())
	)
);

drop policy if exists "area chair update documents" on public.documents;
create policy "area chair update documents" on public.documents
for update using (
	public.jwt_role() = 'area_chair'
	and exists (
		select 1 from public.areas a
		where a.id = documents.area_id
		and a.program_id = public.jwt_program_id()
		and (public.jwt_area_id() is null or a.id = public.jwt_area_id())
	)
)
with check (
	public.jwt_role() = 'area_chair'
	and exists (
		select 1 from public.areas a
		where a.id = documents.area_id
		and a.program_id = public.jwt_program_id()
		and (public.jwt_area_id() is null or a.id = public.jwt_area_id())
	)
);

-- admin_set_role also stores area_id in app_metadata (it already took p_area_id).
create or replace function public.admin_set_role(
	p_user uuid,
	p_role public.user_role,
	p_program_id uuid default null,
	p_area_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	v_profile public.profiles;
begin
	if public.jwt_role() <> 'admin' then
		raise exception 'Only admin can change roles';
	end if;

	update public.profiles
	set role = p_role, program_id = p_program_id, area_id = p_area_id
	where id = p_user
	returning * into v_profile;

	if v_profile.id is null then
		raise exception 'Profile not found';
	end if;

	update auth.users
	set raw_app_meta_data = jsonb_strip_nulls(
		coalesce(raw_app_meta_data, '{}'::jsonb) - 'program_id' - 'area_id'
		|| jsonb_build_object('role', p_role::text, 'program_id', p_program_id, 'area_id', p_area_id)
	)
	where id = p_user;

	insert into public.revisions (entity, entity_id, snapshot, action, actor)
	values ('profile', p_user, to_jsonb(v_profile), 'role_changed', auth.uid());
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS for visits
-- ---------------------------------------------------------------------------

alter table public.visits enable row level security;

drop policy if exists "public read published visits" on public.visits;
create policy "public read published visits" on public.visits
for select using (workflow = 'published');

drop policy if exists "admin focal manage visits" on public.visits;
create policy "admin focal manage visits" on public.visits
for all using (public.jwt_role() in ('admin', 'focal'))
with check (public.jwt_role() in ('admin', 'focal'));

drop policy if exists "reviewer read visits" on public.visits;
create policy "reviewer read visits" on public.visits
for select using (public.jwt_role() = 'reviewer');

drop policy if exists "area chair read visits" on public.visits;
create policy "area chair read visits" on public.visits
for select using (public.jwt_role() = 'area_chair' and program_id = public.jwt_program_id());

-- ---------------------------------------------------------------------------
-- Public read RPCs (published rows only; one call per page, cacheable)
-- ---------------------------------------------------------------------------

-- Index cards: one row per published program with its active visit and counts.
create or replace function public.published_programs()
returns table (
	slug text, code text, name text, degree text, summary text, sort_order int,
	theme_program text, theme_ink text, theme_soft text, theme_contrast text,
	visit_slug text, visit_year int, visit_level text, visit_label text,
	linked bigint, total bigint
)
language sql
stable
security definer
set search_path = public
as $$
	select
		p.slug, p.code, p.name, p.degree, p.summary, p.sort_order,
		p.theme_program, p.theme_ink, p.theme_soft, p.theme_contrast,
		v.slug, v.year, v.level, v.label,
		count(d.id) filter (where d.status = 'linked'),
		count(d.id)
	from public.programs p
	join public.visits v on v.program_id = p.id and v.status = 'active' and v.workflow = 'published'
	left join public.areas a on a.visit_id = v.id and a.status = 'published'
	left join public.documents d on d.area_id = a.id and d.workflow = 'published'
	where p.status = 'published'
	group by p.id, v.id
	order by p.sort_order, p.code;
$$;

-- One program dossier. p_visit null = the active visit.
create or replace function public.published_dossier(p_program text, p_visit text default null)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
	with program as (
		select * from public.programs where slug = p_program and status = 'published'
	),
	visit as (
		select v.* from public.visits v join program p on p.id = v.program_id
		where v.workflow = 'published'
			and (case when p_visit is null then v.status = 'active' else v.slug = p_visit end)
		limit 1
	)
	select case when not exists (select 1 from visit) then null else jsonb_build_object(
		'program', (
			select jsonb_build_object(
				'slug', slug, 'code', code, 'name', name, 'degree', degree, 'summary', summary,
				'sort_order', sort_order,
				'theme', jsonb_build_object(
					'program', theme_program, 'ink', theme_ink, 'soft', theme_soft, 'contrast', theme_contrast
				)
			) from program
		),
		'visit', (
			select jsonb_build_object(
				'slug', slug, 'year', year, 'level', level, 'label', label,
				'previous_label', previous_label, 'status', status
			) from visit
		),
		'visits', (
			select coalesce(jsonb_agg(jsonb_build_object(
				'slug', v.slug, 'year', v.year, 'level', v.level, 'label', v.label, 'status', v.status
			) order by v.year desc, v.sort_order), '[]'::jsonb)
			from public.visits v join program p on p.id = v.program_id
			where v.workflow = 'published'
		),
		'sections', (
			select coalesce(jsonb_agg(jsonb_build_object(
				'slug', a.slug, 'kind', a.kind, 'number', a.number, 'title', a.title,
				'short_title', a.short_title, 'description', a.description, 'focus', a.focus,
				'documents', (
					select coalesce(jsonb_agg(jsonb_build_object(
						'id', d.id, 'title', d.title, 'kind', d.kind, 'format', d.format,
						'status', d.status, 'drive_url', d.drive_url, 'updated', d.updated_label, 'note', d.note
					) order by d.sort_order, d.created_at), '[]'::jsonb)
					from public.documents d
					where d.area_id = a.id and d.workflow = 'published'
				)
			) order by case a.kind when 'common' then 0 when 'current' then 1 else 2 end, a.sort_order, a.number), '[]'::jsonb)
			from public.areas a join visit v on v.id = a.visit_id
			where a.status = 'published'
		)
	) end;
$$;

revoke all on function public.published_programs() from public;
revoke all on function public.published_dossier(text, text) from public;
grant execute on function public.published_programs() to anon, authenticated;
grant execute on function public.published_dossier(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Admin: copy common documents from another program/visit (as new draft rows)
-- ---------------------------------------------------------------------------

create or replace function public.copy_common_documents(p_from_visit uuid, p_to_visit uuid)
returns int
language plpgsql
security invoker
set search_path = public
as $$
declare
	v_from uuid;
	v_to uuid;
	v_count int;
begin
	if public.jwt_role() not in ('admin', 'focal') then
		raise exception 'Only focal or admin can copy common documents';
	end if;

	if p_from_visit = p_to_visit then
		raise exception 'Choose a different source visit';
	end if;

	select id into v_from from public.areas where visit_id = p_from_visit and kind = 'common' order by sort_order limit 1;
	select id into v_to from public.areas where visit_id = p_to_visit and kind = 'common' order by sort_order limit 1;

	if v_from is null then raise exception 'The source visit has no common section'; end if;
	if v_to is null then raise exception 'The target visit has no common section'; end if;

	-- Copies are drafts: someone must check each one belongs to the target program before publishing.
	insert into public.documents (area_id, title, kind, format, drive_url, status, updated_label, note, sort_order, workflow)
	select v_to, title, kind, format, drive_url, status, updated_label, note, sort_order, 'draft'
	from public.documents
	where area_id = v_from;

	get diagnostics v_count = row_count;

	insert into public.revisions (entity, entity_id, snapshot, action, actor)
	values ('visit', p_to_visit, jsonb_build_object('from_visit', p_from_visit, 'copied', v_count), 'common_copied', auth.uid());

	return v_count;
end;
$$;

revoke all on function public.copy_common_documents(uuid, uuid) from public;
grant execute on function public.copy_common_documents(uuid, uuid) to authenticated;

commit;
