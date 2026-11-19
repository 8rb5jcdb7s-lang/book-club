-- Lets a member mark a book as "did not finish" instead of rating it.
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query)

alter table public.ratings_notes
  add column if not exists did_not_finish boolean not null default false;
