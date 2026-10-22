-- CTU Moalboal AACCUP — blocks on the site home page, and two more block kinds
-- Run after 202610260001_more_blocks.sql.
--
-- A block with no program (program_id null) belongs to the home page (/). Only admins and
-- focal persons edit those: the area chair policies require program_id = the chair's program,
-- which a null never matches.
--
--   org:    { title?, items: [{ name, role, unit?, photo?, level: 1|2|3 }] }   (organization chart)
--   events: { title?, items: [{ date, end?, time?, title, place?, body?, href? }] }
--
-- Only additive: program_id may now be null, the kind check gains two kinds, and a public RPC
-- returns the home page's published blocks.

begin;

alter table public.program_blocks alter column program_id drop not null;

alter table public.program_blocks drop constraint if exists program_blocks_kind_check;
alter table public.program_blocks
	add constraint program_blocks_kind_check check (
		kind in (
			'gallery', 'stats', 'text', 'timeline',
			'people', 'vmgo', 'media', 'partners', 'testimonials', 'faq', 'video', 'cta', 'news',
			'org', 'events'
		)
	);

create index if not exists program_blocks_site on public.program_blocks (sort_order) where program_id is null;

-- Public read: published copies of the home page blocks, in order.
create or replace function public.published_site_page()
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
	where b.program_id is null
		and b.published is not null;
$$;

-- Area chairs may only submit their own program's blocks; "<>" let a home block (null program) through.
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
	if v_role = 'area_chair' and v_block.program_id is distinct from public.jwt_program_id() then
		raise exception 'Block is outside your program';
	end if;

	update public.program_blocks set status = 'in_review', updated_by = auth.uid() where id = p_id;

	insert into public.revisions (entity, entity_id, snapshot, action, actor)
	values ('program_block', p_id, to_jsonb(v_block), 'submitted', auth.uid());
end;
$$;

revoke all on function public.published_site_page() from public;
grant execute on function public.published_site_page() to anon, authenticated;

commit;
