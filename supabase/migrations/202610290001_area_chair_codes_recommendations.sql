-- CTU Moalboal AACCUP — area chair, document codes, previous-visit recommendations
-- Run after 202610280001_program_logo.sql.
--
--   areas.chair:      the name of the area chair, shown on the section page
--   documents.code:   an optional evidence code from the survey instrument, e.g. "A3-P1-S2"
--   recommendations:  one row per recommendation of the previous survey, with the action
--                     taken, how far it is complied with, and a link to the evidence.
--                     Public while its section is published; staff edit it like documents
--                     (area chairs may add and update in their own area, not delete).
-- published_dossier() adds chair, updated_at and recommendations to each section, and code
-- to each document. Only additive; existing rows are untouched.

begin;

alter table public.areas add column if not exists chair text
	check (chair is null or char_length(chair) <= 120);
alter table public.documents add column if not exists code text
	check (code is null or char_length(code) <= 40);

create table if not exists public.recommendations (
	id uuid primary key default gen_random_uuid(),
	area_id uuid not null references public.areas(id) on delete cascade,
	number int not null default 1 check (number between 1 and 999),
	recommendation text not null check (char_length(recommendation) between 1 and 2000),
	action_taken text check (action_taken is null or char_length(action_taken) <= 4000),
	status text not null default 'not_yet' check (status in ('complied', 'partial', 'not_yet')),
	evidence_url text check (evidence_url is null or evidence_url ~ '^(https://|/)'),
	sort_order int not null default 0,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	updated_by uuid references public.profiles(id) on delete set null
);

create index if not exists recommendations_area on public.recommendations (area_id, sort_order, number);

drop trigger if exists recommendations_touch on public.recommendations;
create trigger recommendations_touch before update on public.recommendations
for each row execute function public.touch_updated_at();

drop trigger if exists recommendations_updated_by on public.recommendations;
create trigger recommendations_updated_by before update on public.recommendations
for each row execute function public.set_updated_by();

alter table public.recommendations enable row level security;

drop policy if exists "public read published recommendations" on public.recommendations;
create policy "public read published recommendations" on public.recommendations
for select using (
	exists (select 1 from public.areas a where a.id = recommendations.area_id and a.status = 'published')
);

drop policy if exists "admin focal manage recommendations" on public.recommendations;
create policy "admin focal manage recommendations" on public.recommendations
for all using (public.jwt_role() in ('admin', 'focal'))
with check (public.jwt_role() in ('admin', 'focal'));

drop policy if exists "reviewer read recommendations" on public.recommendations;
create policy "reviewer read recommendations" on public.recommendations
for select using (public.jwt_role() = 'reviewer');

drop policy if exists "area chair read recommendations" on public.recommendations;
create policy "area chair read recommendations" on public.recommendations
for select using (
	public.jwt_role() = 'area_chair'
	and exists (
		select 1 from public.areas a
		where a.id = recommendations.area_id
		and a.program_id = public.jwt_program_id()
	)
);

drop policy if exists "area chair insert recommendations" on public.recommendations;
create policy "area chair insert recommendations" on public.recommendations
for insert with check (
	public.jwt_role() = 'area_chair'
	and exists (
		select 1 from public.areas a
		where a.id = recommendations.area_id
		and a.program_id = public.jwt_program_id()
		and (public.jwt_area_id() is null or a.id = public.jwt_area_id())
	)
);

drop policy if exists "area chair update recommendations" on public.recommendations;
create policy "area chair update recommendations" on public.recommendations
for update using (
	public.jwt_role() = 'area_chair'
	and exists (
		select 1 from public.areas a
		where a.id = recommendations.area_id
		and a.program_id = public.jwt_program_id()
		and (public.jwt_area_id() is null or a.id = public.jwt_area_id())
	)
)
with check (
	public.jwt_role() = 'area_chair'
	and exists (
		select 1 from public.areas a
		where a.id = recommendations.area_id
		and a.program_id = public.jwt_program_id()
		and (public.jwt_area_id() is null or a.id = public.jwt_area_id())
	)
);

grant select on public.recommendations to anon;
grant select, insert, update, delete on public.recommendations to authenticated;

CREATE OR REPLACE FUNCTION public.published_dossier(p_program text, p_visit text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
				'sort_order', sort_order, 'logo', logo_url, 'tagline', tagline, 'cover', cover_url,
				'website', website_url, 'email', email, 'phone', phone,
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
				'chair', a.chair,
				-- The latest change to the section or any of its published documents.
				'updated_at', greatest(a.updated_at, (
					select max(d.updated_at) from public.documents d
					where d.area_id = a.id and d.workflow = 'published'
				)),
				'documents', (
					select coalesce(jsonb_agg(jsonb_build_object(
						'id', d.id, 'title', d.title, 'kind', d.kind, 'format', d.format,
						'status', d.status, 'drive_url', d.drive_url, 'updated', d.updated_label, 'note', d.note,
						'code', d.code
					) order by d.sort_order, d.created_at), '[]'::jsonb)
					from public.documents d
					where d.area_id = a.id and d.workflow = 'published'
				),
				'recommendations', (
					select coalesce(jsonb_agg(jsonb_build_object(
						'id', r.id, 'number', r.number, 'recommendation', r.recommendation,
						'action_taken', r.action_taken, 'status', r.status, 'evidence_url', r.evidence_url
					) order by r.sort_order, r.number), '[]'::jsonb)
					from public.recommendations r
					where r.area_id = a.id
				)
			) order by case a.kind when 'common' then 0 when 'current' then 1 else 2 end, a.sort_order, a.number), '[]'::jsonb)
			from public.areas a join visit v on v.id = a.visit_id
			where a.status = 'published'
		)
	) end;
$function$;

commit;
