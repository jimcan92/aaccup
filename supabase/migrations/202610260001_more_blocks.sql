-- CTU Moalboal AACCUP — more landing block kinds
-- Run after 202610250001_timeline_block.sql.
--
--   people:       { title?, items: [{ name, role, credentials?, photo? }] }
--   vmgo:         { title?, vision?, mission?, goals: [text], objectives: [text] }
--   media:        { title?, body?, src?, alt?, side: left|right, button?: { label, href } }
--   partners:     { title?, items: [{ name, logo?, href? }] }
--   testimonials: { title?, items: [{ quote, name, role?, photo? }] }
--   faq:          { title?, items: [{ question, answer }] }
--   video:        { title?, url?, caption? }   (YouTube or Google Drive link)
--   cta:          { title?, body?, buttons: [{ label, href }] }   (at most two)
--   news:         { title?, items: [{ date, title, body?, href? }] }
-- Only widens the allowed block kinds; existing blocks are untouched.

begin;

alter table public.program_blocks drop constraint if exists program_blocks_kind_check;
alter table public.program_blocks
	add constraint program_blocks_kind_check check (
		kind in (
			'gallery', 'stats', 'text', 'timeline',
			'people', 'vmgo', 'media', 'partners', 'testimonials', 'faq', 'video', 'cta', 'news'
		)
	);

commit;
