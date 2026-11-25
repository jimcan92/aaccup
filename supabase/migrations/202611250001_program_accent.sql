-- Program accent color (e.g. BSIE gold beside its maroon). In dark mode the accent carries
-- text, numbers and lines on program pages, while the program color stays on the header,
-- hero and footer. Optional: without it the site uses a lighter tone of the program color.
begin;

alter table public.programs add column if not exists theme_accent text;

alter table public.programs drop constraint if exists programs_theme_accent_hex;
alter table public.programs
	add constraint programs_theme_accent_hex check (theme_accent is null or theme_accent ~* '^#[0-9a-f]{6}$');

-- Same as before, plus 'accent' in the program theme.
create or replace function public.published_dossier(p_program text, p_visit text default null)
returns jsonb
language sql
stable security definer
set search_path to 'public'
as $function$
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
					'program', theme_program, 'ink', theme_ink, 'soft', theme_soft, 'contrast', theme_contrast,
					'accent', theme_accent
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
