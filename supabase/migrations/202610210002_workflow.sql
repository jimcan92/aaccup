-- CTU Moalboal AACCUP 2026 — workflow and roles
-- Run after 202610210001_init.sql.
-- Adds program status, editor attribution, RPCs for submit/review/publish,
-- and an admin-only role sync that updates auth app_metadata.

-- ---------------------------------------------------------------------------
-- Program status + editor attribution
-- ---------------------------------------------------------------------------

alter table public.programs
	add column if not exists status public.workflow_status not null default 'published',
	add column if not exists updated_by uuid references public.profiles(id) on delete set null;

alter table public.areas
	add column if not exists updated_by uuid references public.profiles(id) on delete set null;

alter table public.documents
	add column if not exists updated_by uuid references public.profiles(id) on delete set null;

-- content_blocks already has updated_by/reviewed_by; add the FKs if missing.
do $$
begin
	if not exists (
		select 1 from pg_constraint where conname = 'content_blocks_updated_by_fkey'
	) then
		alter table public.content_blocks
			add constraint content_blocks_updated_by_fkey
			foreign key (updated_by) references public.profiles(id) on delete set null;
	end if;

	if not exists (
		select 1 from pg_constraint where conname = 'content_blocks_reviewed_by_fkey'
	) then
		alter table public.content_blocks
			add constraint content_blocks_reviewed_by_fkey
			foreign key (reviewed_by) references public.profiles(id) on delete set null;
	end if;
end $$;

-- Public sees only published programs.
drop policy if exists "public read programs" on public.programs;
create policy "public read programs" on public.programs
for select using (status = 'published');

-- Editor attribution on every update.
create or replace function public.set_updated_by()
returns trigger
language plpgsql
as $$
begin
	new.updated_by = auth.uid();
	return new;
end;
$$;

drop trigger if exists programs_updated_by on public.programs;
create trigger programs_updated_by before update on public.programs
for each row execute function public.set_updated_by();

drop trigger if exists areas_updated_by on public.areas;
create trigger areas_updated_by before update on public.areas
for each row execute function public.set_updated_by();

drop trigger if exists documents_updated_by on public.documents;
create trigger documents_updated_by before update on public.documents
for each row execute function public.set_updated_by();

drop trigger if exists content_blocks_updated_by on public.content_blocks;
create trigger content_blocks_updated_by before update on public.content_blocks
for each row execute function public.set_updated_by();

-- ---------------------------------------------------------------------------
-- Published content read helper
-- ---------------------------------------------------------------------------

create or replace function public.published_content()
returns table (key text, value text)
language sql
stable
security invoker
as $$
	select key, published_value
	from public.content_blocks
	where status = 'published';
$$;

-- ---------------------------------------------------------------------------
-- Content block workflow
-- ---------------------------------------------------------------------------

create or replace function public.submit_content_block(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	v_role text := public.jwt_role();
begin
	if v_role not in ('admin', 'focal') then
		raise exception 'Only focal or admin can submit site content';
	end if;

	update public.content_blocks
	set status = 'in_review', updated_by = auth.uid()
	where id = p_id and status in ('draft', 'approved');

	if not found then
		raise exception 'Content block not found or not submittable';
	end if;

	insert into public.revisions (entity, entity_id, snapshot, action, actor)
	select 'content_block', id, to_jsonb(content_blocks), 'submitted', auth.uid()
	from public.content_blocks where id = p_id;
end;
$$;

create or replace function public.review_content_block(p_id uuid, p_approve boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	v_role text := public.jwt_role();
begin
	if v_role not in ('admin', 'focal', 'reviewer') then
		raise exception 'Only reviewer, focal, or admin can review';
	end if;

	update public.content_blocks
	set
		status = case when p_approve then 'approved'::public.workflow_status else 'draft'::public.workflow_status end,
		reviewed_by = auth.uid(),
		updated_by = auth.uid()
	where id = p_id and status = 'in_review';

	if not found then
		raise exception 'Content block not found or not in review';
	end if;

	insert into public.revisions (entity, entity_id, snapshot, action, actor)
	select
		'content_block',
		id,
		to_jsonb(content_blocks),
		case when p_approve then 'approved' else 'returned' end,
		auth.uid()
	from public.content_blocks where id = p_id;
end;
$$;

create or replace function public.publish_content_block(p_id uuid)
returns public.content_blocks
language plpgsql
security definer
set search_path = public
as $$
declare
	v_role text := public.jwt_role();
	v_block public.content_blocks;
begin
	if v_role not in ('admin', 'focal') then
		raise exception 'Only focal or admin can publish site content';
	end if;

	update public.content_blocks
	set
		published_value = draft_value,
		status = 'published',
		published_at = now(),
		reviewed_by = coalesce(reviewed_by, auth.uid()),
		updated_by = auth.uid()
	where id = p_id
	returning * into v_block;

	if v_block.id is null then
		raise exception 'Content block not found';
	end if;

	insert into public.revisions (entity, entity_id, snapshot, action, actor)
	values ('content_block', v_block.id, to_jsonb(v_block), 'published', auth.uid());

	insert into public.publish_log (entity, entity_id, summary, actor)
	values ('content_block', v_block.id, v_block.key, auth.uid());

	return v_block;
end;
$$;

-- ---------------------------------------------------------------------------
-- Area workflow
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
	if v_role not in ('admin', 'focal', 'area_chair') then
		raise exception 'Not allowed';
	end if;

	select * into v_area from public.areas where id = p_id;

	if v_area.id is null then
		raise exception 'Area not found';
	end if;

	if v_role = 'area_chair' and v_area.program_id <> public.jwt_program_id() then
		raise exception 'Area is outside your program';
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
	if v_role not in ('admin', 'focal') then
		raise exception 'Only focal or admin can publish an area';
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

-- ---------------------------------------------------------------------------
-- Document workflow
-- ---------------------------------------------------------------------------

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
	if v_role not in ('admin', 'focal', 'area_chair') then
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
	if v_role not in ('admin', 'focal') then
		raise exception 'Only focal or admin can publish a document';
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

-- ---------------------------------------------------------------------------
-- Narrow the area-chair document policy: insert/update only, no delete.
-- The first migration used a broad FOR ALL policy; replace it.
-- ---------------------------------------------------------------------------

drop policy if exists "area chair manage documents" on public.documents;

drop policy if exists "area chair insert documents" on public.documents;
create policy "area chair insert documents" on public.documents
for insert with check (
	public.jwt_role() = 'area_chair'
	and exists (
		select 1 from public.areas a
		where a.id = documents.area_id
		and a.program_id = public.jwt_program_id()
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

-- ---------------------------------------------------------------------------
-- Workflow guards: area chairs can submit, not publish
-- ---------------------------------------------------------------------------

create or replace function public.guard_area_workflow()
returns trigger
language plpgsql
as $$
begin
	if coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
		return new;
	end if;

	if public.jwt_role() = 'area_chair'
		and new.status in ('approved', 'published') then
		raise exception 'Area chairs can submit for review, not approve or publish';
	end if;

	return new;
end;
$$;

drop trigger if exists areas_workflow_guard on public.areas;
create trigger areas_workflow_guard before update on public.areas
for each row execute function public.guard_area_workflow();

create or replace function public.guard_document_workflow()
returns trigger
language plpgsql
as $$
begin
	if coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
		return new;
	end if;

	if public.jwt_role() = 'area_chair'
		and new.workflow in ('approved', 'published') then
		raise exception 'Area chairs can submit for review, not approve or publish';
	end if;

	return new;
end;
$$;

drop trigger if exists documents_workflow_guard on public.documents;
create trigger documents_workflow_guard before update on public.documents
for each row execute function public.guard_document_workflow();

-- ---------------------------------------------------------------------------
-- Admin role sync: profiles + auth app_metadata in one transaction
-- ---------------------------------------------------------------------------

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
		coalesce(raw_app_meta_data, '{}'::jsonb)
		|| jsonb_build_object('role', p_role::text, 'program_id', p_program_id)
	)
	where id = p_user;

	insert into public.revisions (entity, entity_id, snapshot, action, actor)
	values ('profile', p_user, to_jsonb(v_profile), 'role_changed', auth.uid());
end;
$$;

-- ---------------------------------------------------------------------------
-- Execute grants
-- ---------------------------------------------------------------------------

revoke all on function public.published_content() from public;
grant execute on function public.published_content() to anon, authenticated;

revoke all on function public.submit_content_block(uuid) from public;
revoke all on function public.review_content_block(uuid, boolean) from public;
revoke all on function public.publish_content_block(uuid) from public;
revoke all on function public.submit_area(uuid) from public;
revoke all on function public.publish_area(uuid) from public;
revoke all on function public.submit_document(uuid) from public;
revoke all on function public.publish_document(uuid) from public;
revoke all on function public.admin_set_role(uuid, public.user_role, uuid, uuid) from public;

grant execute on function public.submit_content_block(uuid) to authenticated;
grant execute on function public.review_content_block(uuid, boolean) to authenticated;
grant execute on function public.publish_content_block(uuid) to authenticated;
grant execute on function public.submit_area(uuid) to authenticated;
grant execute on function public.publish_area(uuid) to authenticated;
grant execute on function public.submit_document(uuid) to authenticated;
grant execute on function public.publish_document(uuid) to authenticated;
grant execute on function public.admin_set_role(uuid, public.user_role, uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Seed programs. Areas/documents are seeded by the admin UI or a data import.
-- ---------------------------------------------------------------------------

insert into public.programs (
	code, name, degree, visit_level, status_label, status_note,
	survey_year, previous_visit_label, summary, summary_title,
	accent, accent_soft, accent_ink, sort_order, status
)
values
	(
		'BSIE',
		'Bachelor of Science in Industrial Engineering',
		'BS Industrial Engineering',
		'Level III',
		'Level III visit',
		'Applying for Level III accreditation',
		2026,
		'Previous survey',
		'Industrial engineering at Moalboal prepares students to design, improve, and manage integrated systems of people, materials, information, and energy. The Level III dossier documents the program’s systems, its faculty, and its evidence of continuous improvement.',
		'The industrial engineering record.',
		'#7A1E2B',
		'#F1E2E4',
		'#3B0D14',
		1,
		'published'
	),
	(
		'BSFI',
		'Bachelor of Science in Fisheries',
		'BS Fisheries',
		'Level III',
		'Level III visit',
		'Applying for Level III accreditation',
		2026,
		'2024 survey',
		'Fisheries is the campus’s founding discipline. The Level III dossier traces the program from its coastal field work to its research, extension, and instruction record, with the evidence organised area by area.',
		'The fisheries record.',
		'#1D5B3A',
		'#E2EDE4',
		'#0B2C1B',
		2,
		'published'
	)
on conflict (code) do nothing;
