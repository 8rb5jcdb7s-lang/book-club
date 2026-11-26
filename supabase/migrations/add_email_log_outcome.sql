-- Records what happened to each club email (how many were sent, how many
-- failed and why), so a failed send is visible on the profile page instead
-- of failing silently.
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query)

alter table public.email_log
  add column if not exists sent_count integer,
  add column if not exists failed_count integer,
  add column if not exists error text;
