-- Tracks which members have finished the currently-reading book and are
-- ready to discuss it.
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query)

create table public.book_finishes (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  finished_at timestamptz not null default now(),
  unique (book_id, user_id)
);

alter table public.book_finishes enable row level security;

create policy "Finish marks are viewable by authenticated users"
  on public.book_finishes for select
  to authenticated
  using (true);

create policy "Users can manage their own finish marks"
  on public.book_finishes for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
