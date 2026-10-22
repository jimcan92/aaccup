-- CTU Moalboal AACCUP — timeline blocks on program landing pages
-- Run after 202610240001_program_landing.sql.
--
-- A timeline block lists dated milestones (a program's or the campus's history):
--   timeline: { title?, items: [{ year, title, body? }] }   (body is plain paragraphs)
-- Only widens the allowed block kinds; existing blocks are untouched.

begin;

alter table public.program_blocks drop constraint if exists program_blocks_kind_check;
alter table public.program_blocks
	add constraint program_blocks_kind_check check (kind in ('gallery', 'stats', 'text', 'timeline'));

commit;
