-- CTU Moalboal AACCUP — program logo, tagline and contact details
-- Run after 202610270001_site_blocks.sql.
--
-- Optional program fields, shown on the home page cards and the program home page:
--   logo_url:    an uploaded image (or Drive / image link)
--   cover_url:   a photo behind the program's home page card (and its banner when it has no gallery)
--   tagline:     one short line under the program name
--   website_url, email, phone: how to reach the program
-- published_programs() returns them (its result type changes, so it is dropped and
-- recreated inside this transaction) and published_dossier() adds them to its program object.
-- Only additive; existing values are untouched.

begin;

alter table public.programs add column if not exists logo_url text;
alter table public.programs add column if not exists tagline text;
alter table public.programs add column if not exists cover_url text;
alter table public.programs add column if not exists website_url text;
alter table public.programs add column if not exists email text;
alter table public.programs add column if not exists phone text;

drop function if exists public.published_programs();
create function public.published_programs()
returns table (
	slug text, code text, name text, degree text, summary text, sort_order integer,
	theme_program text, theme_ink text, theme_soft text, theme_contrast text,
	visit_slug text, visit_year integer, visit_level text, visit_label text,
	linked bigint, total bigint,
	logo_url text, tagline text, cover_url text
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
		count(d.id),
		p.logo_url, p.tagline, p.cover_url
	from public.programs p
	join public.visits v on v.program_id = p.id and v.status = 'active' and v.workflow = 'published'
	left join public.areas a on a.visit_id = v.id and a.status = 'published'
	left join public.documents d on d.area_id = a.id and d.workflow = 'published'
	where p.status = 'published'
	group by p.id, v.id
	order by p.sort_order, p.code;
$$;

revoke all on function public.published_programs() from public;
grant execute on function public.published_programs() to anon, authenticated;

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
$function$;

commit;
