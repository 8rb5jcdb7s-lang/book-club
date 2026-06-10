-- Adds profile picture support
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query)

-- ============================================================
-- profiles.avatar_url
-- ============================================================
alter table public.profiles
  add column avatar_url text;

-- ============================================================
-- Storage bucket for avatars
-- ============================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly accessible"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars');

create policy "Authenticated users can update avatars"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars');
