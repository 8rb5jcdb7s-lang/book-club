-- Thumbs-up votes on the Want to Read list: one per member per book.
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query)

create table if not exists public.book_votes (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (book_id, user_id)
);

alter table public.book_votes enable row level security;

drop policy if exists "Votes are viewable by authenticated users" on public.book_votes;
create policy "Votes are viewable by authenticated users"
  on public.book_votes for select
  to authenticated
  using (true);

drop policy if exists "Users can manage their own votes" on public.book_votes;
create policy "Users can manage their own votes"
  on public.book_votes for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
