-- Email notifications: a per-member mute switch, and a log so each email is
-- only ever sent once (e.g. un-clicking and re-clicking "I finished it!"
-- doesn't email everyone twice).
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query)

alter table public.profiles
  add column if not exists email_notifications boolean not null default true;

create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  book_id uuid not null references public.books (id) on delete cascade,
  -- Who the email is about ('' when it isn't about one person).
  subject_key text not null default '',
  sent_at timestamptz not null default now(),
  unique (kind, book_id, subject_key)
);

-- Only the server (using the secret key) reads or writes this table.
alter table public.email_log enable row level security;
