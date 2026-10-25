-- Home hero photo: an image behind the home page heading, under a dark theme tint.
-- Empty until an admin uploads one under Admin → Home page; the hero keeps its plain look until then.
-- Safe to rerun; an existing row is left alone.

insert into public.content_blocks (key, label, group_name, type, draft_value, published_value, status, sort_order)
values ('home.hero.image', 'Hero photo', 'Home', 'image', '', '', 'published', 30)
on conflict (key) do nothing;
