-- Program cards count the way section pages show documents: once a section has a published Drive
-- item, its link-less placeholder rows are left out of the total (they are hidden on the page too).
-- A section with no Drive items yet keeps its placeholders in the count.
create or replace function public.published_programs()
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
		count(d.id) filter (where d.drive_url is not null or not coalesce(a.has_drive, false)),
		p.logo_url, p.tagline, p.cover_url
	from public.programs p
	join public.visits v on v.program_id = p.id and v.status = 'active' and v.workflow = 'published'
	left join lateral (
		select a.id, exists (
			select 1 from public.documents x
			where x.area_id = a.id and x.workflow = 'published' and x.drive_url is not null
		) as has_drive
		from public.areas a
		where a.visit_id = v.id and a.status = 'published'
	) a on true
	left join public.documents d on d.area_id = a.id and d.workflow = 'published'
	where p.status = 'published'
	group by p.id, v.id
	order by p.sort_order, p.code;
$$;
