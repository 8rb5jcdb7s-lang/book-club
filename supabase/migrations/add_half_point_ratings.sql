-- Allows ratings in half-point steps (e.g. 7.5) instead of whole numbers only.
-- Existing ratings are kept exactly as they are.
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query)

alter table public.ratings_notes
  alter column rating type numeric(3,1);
