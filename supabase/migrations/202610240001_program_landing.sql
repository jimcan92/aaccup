-- CTU Moalboal AACCUP — program landing pages
-- Run after 202610230001_drive_sync.sql.
--
-- /[program] becomes a landing page built from blocks: photo galleries, highlights (stats),
-- and text sections. The document dossier moves to /[program]/dossier.
--
-- Each block keeps a draft and a published copy, like content_blocks, so editing a live
-- block does not hide it: the public page shows `published` until the draft is published.
-- Area chairs draft blocks for their own program; focal persons and admins publish.
-- Only additive changes, plus "dossier" joins the reserved section slugs.

begin;

-- ---------------------------------------------------------------------------
-- "dossier" is now a route under /[program]; no section may use it as its slug.
-- ---------------------------------------------------------------------------

alter table public.areas drop constraint if exists areas_slug_format;
alter table public.areas
	add constraint areas_slug_format check (
		slug ~ '^[a-z][a-z0-9-]*$'
		and slug not in ('documents', 'visit', 'areas', 'records', 'about', 'dossier')
	);

-- ---------------------------------------------------------------------------
-- Blocks
-- ---------------------------------------------------------------------------

create table if not exists public.program_blocks (
	id uuid primary key default gen_random_uuid(),
	program_id uuid not null references public.programs(id) on delete cascade,
	-- gallery: { title?, items: [{ src, alt, caption? }] }   (first gallery is the hero banner)
	-- stats:   { title?, items: [{ value, label }] }
	-- text:    { title, body }                                  (plain paragraphs)
	kind text not null check (kind in ('gallery', 'stats', 'text')),
	sort_order int not null default 0,
	draft jsonb not null default '{}'::jsonb,
	published jsonb,
	status public.workflow_status not null default 'draft',
	updated_by uuid references public.profiles(id) on delete set null,
	reviewed_by uuid references public.profiles(id) on delete set null,
	published_at timestamptz,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists program_blocks_program on public.program_blocks (program_id, sort_order);

drop trigger if exists program_blocks_touch_updated_at on public.program_blocks;
create trigger program_blocks_touch_updated_at before update on public.program_blocks
for each row execute function public.touch_updated_at();

drop trigger if exists program_blocks_updated_by on public.program_blocks;
create trigger program_blocks_updated_by before update on public.program_blocks
for each row execute function public.set_updated_by();

-- Area chairs edit the draft only: they cannot change what is live or mark it approved/published.
create or replace function public.guard_program_block()
returns trigger
language plpgsql
as $$
begin
	if coalesce(auth.jwt() ->> 'role', '') = 'service_role' or public.jwt_role() <> 'area_chair' then
		return new;
	end if;

	if new.status in ('approved', 'published') then
		raise exception 'Area chairs can submit for review, not approve or publish';
	end if;

	if tg_op = 'INSERT' and new.published is not null then
		raise exception 'Area chairs cannot publish a block';
	end if;

	if tg_op = 'UPDATE' and new.published is distinct from old.published then
		raise exception 'Area chairs cannot change the published copy';
	end if;

	return new;
end;
$$;

drop trigger if exists program_blocks_guard on public.program_blocks;
create trigger program_blocks_guard before insert or update on public.program_blocks
for each row execute function public.guard_program_block();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.program_blocks enable row level security;

drop policy if exists "admin focal manage program blocks" on public.program_blocks;
create policy "admin focal manage program blocks" on public.program_blocks
for all using (public.jwt_role() in ('admin', 'focal'))
with check (public.jwt_role() in ('admin', 'focal'));

drop policy if exists "reviewer read program blocks" on public.program_blocks;
create policy "reviewer read program blocks" on public.program_blocks
for select using (public.jwt_role() = 'reviewer');

drop policy if exists "area chair read program blocks" on public.program_blocks;
create policy "area chair read program blocks" on public.program_blocks
for select using (public.jwt_role() = 'area_chair' and program_id = public.jwt_program_id());

drop policy if exists "area chair insert program blocks" on public.program_blocks;
create policy "area chair insert program blocks" on public.program_blocks
for insert with check (public.jwt_role() = 'area_chair' and program_id = public.jwt_program_id());

drop policy if exists "area chair update program blocks" on public.program_blocks;
create policy "area chair update program blocks" on public.program_blocks
for update using (public.jwt_role() = 'area_chair' and program_id = public.jwt_program_id())
with check (public.jwt_role() = 'area_chair' and program_id = public.jwt_program_id());

-- No anon policy: the public reads published copies through published_program_page().

-- ---------------------------------------------------------------------------
-- Workflow RPCs
-- ---------------------------------------------------------------------------

create or replace function public.submit_program_block(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	v_role text := public.jwt_role();
	v_block public.program_blocks;
begin
	if v_role not in ('admin', 'focal', 'area_chair') then
		raise exception 'Not allowed';
	end if;

	select * into v_block from public.program_blocks where id = p_id;
	if v_block.id is null then
		raise exception 'Block not found';
	end if;
	if v_role = 'area_chair' and v_block.program_id <> public.jwt_program_id() then
		raise exception 'Block is outside your program';
	end if;

	update public.program_blocks set status = 'in_review', updated_by = auth.uid() where id = p_id;

	insert into public.revisions (entity, entity_id, snapshot, action, actor)
	values ('program_block', p_id, to_jsonb(v_block), 'submitted', auth.uid());
end;
$$;

create or replace function public.publish_program_block(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	v_block public.program_blocks;
begin
	if public.jwt_role() not in ('admin', 'focal') then
		raise exception 'Only focal or admin can publish';
	end if;

	update public.program_blocks
	set published = draft,
		status = 'published',
		published_at = now(),
		reviewed_by = coalesce(reviewed_by, auth.uid()),
		updated_by = auth.uid()
	where id = p_id
	returning * into v_block;

	if v_block.id is null then
		raise exception 'Block not found';
	end if;

	insert into public.revisions (entity, entity_id, snapshot, action, actor)
	values ('program_block', v_block.id, to_jsonb(v_block), 'published', auth.uid());

	insert into public.publish_log (entity, entity_id, summary, actor)
	values ('program_block', v_block.id, coalesce(v_block.draft ->> 'title', v_block.kind), auth.uid());
end;
$$;

-- Take a block off the public page without deleting it.
create or replace function public.unpublish_program_block(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
	if public.jwt_role() not in ('admin', 'focal') then
		raise exception 'Only focal or admin can unpublish';
	end if;

	update public.program_blocks set published = null, status = 'draft', updated_by = auth.uid() where id = p_id;

	insert into public.revisions (entity, entity_id, snapshot, action, actor)
	select 'program_block', id, to_jsonb(program_blocks), 'unpublished', auth.uid()
	from public.program_blocks where id = p_id;
end;
$$;

revoke all on function public.submit_program_block(uuid) from public;
revoke all on function public.publish_program_block(uuid) from public;
revoke all on function public.unpublish_program_block(uuid) from public;
grant execute on function public.submit_program_block(uuid) to authenticated;
grant execute on function public.publish_program_block(uuid) to authenticated;
grant execute on function public.unpublish_program_block(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Public read: published copies of a published program's blocks, in order.
-- ---------------------------------------------------------------------------

create or replace function public.published_program_page(p_program text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
	select coalesce(
		jsonb_agg(jsonb_build_object('id', b.id, 'kind', b.kind, 'content', b.published) order by b.sort_order, b.created_at),
		'[]'::jsonb
	)
	from public.program_blocks b
	join public.programs p on p.id = b.program_id
	where p.slug = p_program
		and p.status = 'published'
		and b.published is not null;
$$;

revoke all on function public.published_program_page(text) from public;
grant execute on function public.published_program_page(text) to anon, authenticated;

commit;
