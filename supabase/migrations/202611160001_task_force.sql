-- CTU Moalboal AACCUP — task force role
--
-- A task force member works on any number of sections (areas), across programs:
--   - public.area_members lists the sections each task force member is assigned to;
--   - they read, add and edit documents, recommendations and section details in those sections
--     only, submit and publish them (documents and the section), and run the section's Drive
--     sync (done by the app with the service role after its own check);
--   - they never delete, and see nothing outside their sections.
-- Assignments are read live from area_members (by auth.uid()), so changes apply at once
-- without refreshing the staff token.

-- Must commit before 'task_force' can be stored; policies below compare text only.
alter type public.user_role add value if not exists 'task_force';

begin;

create table if not exists public.area_members (
	profile_id uuid not null references public.profiles(id) on delete cascade,
	area_id uuid not null references public.areas(id) on delete cascade,
	created_at timestamptz not null default now(),
	primary key (profile_id, area_id)
);

create index if not exists area_members_area_idx on public.area_members (area_id);

alter table public.area_members enable row level security;

drop policy if exists "admin manage area members" on public.area_members;
create policy "admin manage area members" on public.area_members
for all using (public.jwt_role() = 'admin')
with check (public.jwt_role() = 'admin');

drop policy if exists "focal read area members" on public.area_members;
create policy "focal read area members" on public.area_members
for select using (public.jwt_role() = 'focal');

drop policy if exists "members read own areas" on public.area_members;
create policy "members read own areas" on public.area_members
for select using (profile_id = auth.uid());

-- True when the signed-in task force member is assigned to the area.
-- security definer: reads area_members without going through its RLS (no policy recursion).
create or replace function public.is_area_member(p_area uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select public.jwt_role() = 'task_force'
		and exists (select 1 from public.area_members m where m.profile_id = auth.uid() and m.area_id = p_area);
$$;

-- ---------------------------------------------------------------------------
-- Row-level security for task force members
-- ---------------------------------------------------------------------------

drop policy if exists "task force read areas" on public.areas;
create policy "task force read areas" on public.areas
for select using (public.is_area_member(id));

drop policy if exists "task force update areas" on public.areas;
create policy "task force update areas" on public.areas
for update using (public.is_area_member(id))
with check (public.is_area_member(id));

drop policy if exists "task force read visits" on public.visits;
create policy "task force read visits" on public.visits
for select using (
	public.jwt_role() = 'task_force'
	and exists (select 1 from public.areas a where a.visit_id = visits.id and public.is_area_member(a.id))
);

drop policy if exists "task force read documents" on public.documents;
create policy "task force read documents" on public.documents
for select using (public.is_area_member(area_id));

drop policy if exists "task force insert documents" on public.documents;
create policy "task force insert documents" on public.documents
for insert with check (public.is_area_member(area_id));

drop policy if exists "task force update documents" on public.documents;
create policy "task force update documents" on public.documents
for update using (public.is_area_member(area_id))
with check (public.is_area_member(area_id));

drop policy if exists "task force read recommendations" on public.recommendations;
create policy "task force read recommendations" on public.recommendations
for select using (public.is_area_member(area_id));

drop policy if exists "task force insert recommendations" on public.recommendations;
create policy "task force insert recommendations" on public.recommendations
for insert with check (public.is_area_member(area_id));

drop policy if exists "task force update recommendations" on public.recommendations;
create policy "task force update recommendations" on public.recommendations
for update using (public.is_area_member(area_id))
with check (public.is_area_member(area_id));

drop policy if exists "staff read revisions" on public.revisions;
create policy "staff read revisions" on public.revisions
for select using (public.jwt_role() in ('admin', 'focal', 'reviewer', 'area_chair', 'task_force'));

drop policy if exists "staff write revisions" on public.revisions;
create policy "staff write revisions" on public.revisions
for insert with check (public.jwt_role() in ('admin', 'focal', 'area_chair', 'task_force'));

drop policy if exists "staff read drive sync runs" on public.drive_sync_runs;
create policy "staff read drive sync runs" on public.drive_sync_runs
for select using (public.jwt_role() in ('admin', 'focal', 'reviewer', 'area_chair', 'task_force'));

-- ---------------------------------------------------------------------------
-- Workflow RPCs: task force members submit and publish in their own sections
-- ---------------------------------------------------------------------------

create or replace function public.submit_area(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	v_role text := public.jwt_role();
	v_area public.areas;
begin
	if v_role not in ('admin', 'focal', 'area_chair', 'task_force') then
		raise exception 'Not allowed';
	end if;

	select * into v_area from public.areas where id = p_id;

	if v_area.id is null then
		raise exception 'Area not found';
	end if;

	if v_role = 'area_chair' and v_area.program_id <> public.jwt_program_id() then
		raise exception 'Area is outside your program';
	end if;

	if v_role = 'task_force' and not public.is_area_member(p_id) then
		raise exception 'Area is not assigned to you';
	end if;

	update public.areas
	set status = 'in_review', updated_by = auth.uid()
	where id = p_id and status in ('draft', 'approved');

	if not found then
		raise exception 'Area not found or not submittable';
	end if;

	insert into public.revisions (entity, entity_id, snapshot, action, actor)
	values ('area', p_id, to_jsonb(v_area), 'submitted', auth.uid());
end;
$$;

create or replace function public.publish_area(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	v_role text := public.jwt_role();
	v_area public.areas;
begin
	if not (v_role in ('admin', 'focal') or (v_role = 'task_force' and public.is_area_member(p_id))) then
		raise exception 'Only focal, admin, or the section''s task force can publish an area';
	end if;

	update public.areas
	set status = 'published', updated_by = auth.uid()
	where id = p_id
	returning * into v_area;

	if v_area.id is null then
		raise exception 'Area not found';
	end if;

	insert into public.revisions (entity, entity_id, snapshot, action, actor)
	values ('area', v_area.id, to_jsonb(v_area), 'published', auth.uid());

	insert into public.publish_log (entity, entity_id, summary, actor)
	values ('area', v_area.id, v_area.title, auth.uid());
end;
$$;

create or replace function public.submit_document(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	v_role text := public.jwt_role();
	v_doc public.documents;
	v_program uuid;
begin
	if v_role not in ('admin', 'focal', 'area_chair', 'task_force') then
		raise exception 'Not allowed';
	end if;

	select d.* into v_doc
	from public.documents d
	where d.id = p_id;

	if v_doc.id is null then
		raise exception 'Document not found';
	end if;

	select a.program_id into v_program
	from public.areas a
	where a.id = v_doc.area_id;

	if v_role = 'area_chair' and v_program <> public.jwt_program_id() then
		raise exception 'Document is outside your program';
	end if;

	if v_role = 'task_force' and not public.is_area_member(v_doc.area_id) then
		raise exception 'Document is outside your sections';
	end if;

	update public.documents
	set workflow = 'in_review', updated_by = auth.uid()
	where id = p_id and workflow in ('draft', 'approved');

	if not found then
		raise exception 'Document not found or not submittable';
	end if;

	insert into public.revisions (entity, entity_id, snapshot, action, actor)
	values ('document', p_id, to_jsonb(v_doc), 'submitted', auth.uid());
end;
$$;

create or replace function public.publish_document(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	v_role text := public.jwt_role();
	v_doc public.documents;
begin
	if v_role = 'task_force' then
		select d.* into v_doc from public.documents d where d.id = p_id;
		if v_doc.id is null or not public.is_area_member(v_doc.area_id) then
			raise exception 'Document is outside your sections';
		end if;
	elsif v_role not in ('admin', 'focal') then
		raise exception 'Only focal, admin, or the section''s task force can publish a document';
	end if;

	update public.documents
	set workflow = 'published', updated_by = auth.uid()
	where id = p_id
	returning * into v_doc;

	if v_doc.id is null then
		raise exception 'Document not found';
	end if;

	insert into public.revisions (entity, entity_id, snapshot, action, actor)
	values ('document', v_doc.id, to_jsonb(v_doc), 'published', auth.uid());

	insert into public.publish_log (entity, entity_id, summary, actor)
	values ('document', v_doc.id, v_doc.title, auth.uid());
end;
$$;

commit;
