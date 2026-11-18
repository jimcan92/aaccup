-- CTU Moalboal AACCUP — "Extension projects" landing block
-- Run after 202611180001_showcase_block.sql.
--
--   projects: { title?, intro?, video?, videoCaption?, stats: [{ value, label }],
--               items: [{ title, partner?, date?, beneficiaries?, body?, photo?, photos?: [src], href? }] }
--   (a featured video with short figures, then a card for each extension project)
--
-- Only additive: the kind check gains one kind.

begin;

alter table public.program_blocks drop constraint if exists program_blocks_kind_check;
alter table public.program_blocks
	add constraint program_blocks_kind_check check (
		kind in (
			'gallery', 'stats', 'text', 'timeline',
			'people', 'vmgo', 'media', 'partners', 'testimonials', 'faq', 'video', 'cta', 'news',
			'org', 'events', 'documents', 'showcase', 'projects'
		)
	);

commit;
