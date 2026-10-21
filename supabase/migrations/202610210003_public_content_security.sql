-- Public content security
-- RLS is row-level, not column-level. A published row still exposes draft_value
-- if anon can select the table directly. The public site must read through the
-- published_content() RPC instead.

revoke select on public.content_blocks from anon;

drop policy if exists "public read published blocks" on public.content_blocks;

create or replace function public.published_content()
returns table (key text, value text)
language sql
stable
security definer
set search_path = public
as $$
	select key, published_value
	from public.content_blocks
	where status = 'published';
$$;

revoke all on function public.published_content() from public;
grant execute on function public.published_content() to anon, authenticated;
