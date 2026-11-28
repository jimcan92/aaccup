-- Public videos for landing blocks (e.g. the task force intro), played with a plain <video> so they can autoplay.
-- Anyone may read; uploads go through the service role only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('public-videos', 'public-videos', true, 52428800, array['video/mp4', 'video/webm'])
on conflict (id) do nothing;
