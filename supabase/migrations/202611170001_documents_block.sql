-- CTU Moalboal AACCUP — "Key documents" landing block
-- Run after 202611160001_task_force.sql.
--
--   documents: { title?, intro?, items: [{ title, label?, url }] }   (key records shown as PDF cards)
--
-- Only additive: the kind check gains one kind.

begin;

alter table public.program_blocks drop constraint if exists program_blocks_kind_check;
alter table public.program_blocks
	add constraint program_blocks_kind_check check (
		kind in (
			'gallery', 'stats', 'text', 'timeline',
			'people', 'vmgo', 'media', 'partners', 'testimonials', 'faq', 'video', 'cta', 'news',
			'org', 'events', 'documents'
		)
	);

commit;
