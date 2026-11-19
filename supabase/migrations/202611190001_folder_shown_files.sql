-- A published folder document lists its Drive folder's contents on the public site.
-- shown_files narrows that list to chosen items (Drive file or subfolder ids at the folder's
-- top level), e.g. only the compiled PDF. null = show everything, as before.
alter table public.documents
	add column if not exists shown_files text[];

alter table public.documents
	drop constraint if exists documents_shown_files_check;
alter table public.documents
	add constraint documents_shown_files_check
	check (shown_files is null or (cardinality(shown_files) between 1 and 500 and format = 'folder'));
