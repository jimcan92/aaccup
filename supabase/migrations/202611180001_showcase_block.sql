-- CTU Moalboal AACCUP — "System showcase" landing block
-- Run after 202611170001_documents_block.sql.
--
--   showcase: { title?, eyebrow?, body?, url?, features: [{ icon, title, text? }],
--               shots: [{ src, caption? }], button?: { label, href }, side? }
--   (a system built by the program: features beside a screenshot slideshow)
--
-- Only additive: the kind check gains one kind.

begin;

alter table public.program_blocks drop constraint if exists program_blocks_kind_check;
alter table public.program_blocks
	add constraint program_blocks_kind_check check (
		kind in (
			'gallery', 'stats', 'text', 'timeline',
			'people', 'vmgo', 'media', 'partners', 'testimonials', 'faq', 'video', 'cta', 'news',
			'org', 'events', 'documents', 'showcase'
		)
	);

commit;
