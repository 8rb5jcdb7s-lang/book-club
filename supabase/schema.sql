-- Book Club App schema
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query)

-- ============================================================
-- profiles
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Auto-create a profile row when a new auth user is created
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- books
-- ============================================================
create table public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  cover_url text,
  page_count int,
  genre text,
  open_library_id text,
  status text not null default 'queued' check (status in ('queued', 'reading', 'finished')),
  picked_by uuid references public.profiles (id),
  date_started date,
  date_finished date,
  target_finish_date date,
  pages_read_so_far int not null default 0,
  created_at timestamptz not null default now(),
  is_active boolean generated always as (status = 'reading') stored
);

-- Only one book can be "currently reading" at a time
create unique index one_currently_reading_idx
  on public.books (is_active)
  where is_active;

alter table public.books enable row level security;

create policy "Books are viewable by authenticated users"
  on public.books for select
  to authenticated
  using (true);

create policy "Authenticated users can manage books"
  on public.books for all
  to authenticated
  using (true)
  with check (true);

-- ============================================================
-- ratings_notes
-- ============================================================
create table public.ratings_notes (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating int check (rating between 1 and 10),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (book_id, user_id)
);

alter table public.ratings_notes enable row level security;

create policy "Ratings/notes are viewable by authenticated users"
  on public.ratings_notes for select
  to authenticated
  using (true);

create policy "Users can manage their own ratings/notes"
  on public.ratings_notes for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- quotes
-- ============================================================
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  quote_text text not null,
  page_number int,
  created_at timestamptz not null default now()
);

alter table public.quotes enable row level security;

create policy "Quotes are viewable by authenticated users"
  on public.quotes for select
  to authenticated
  using (true);

create policy "Users can add their own quotes"
  on public.quotes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete their own quotes"
  on public.quotes for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================
-- picker_rotation (singleton row, id always 1)
-- ============================================================
create table public.picker_rotation (
  id int primary key default 1 check (id = 1),
  member_order uuid[] not null default '{}',
  current_index int not null default 0
);

alter table public.picker_rotation enable row level security;

create policy "Rotation is viewable by authenticated users"
  on public.picker_rotation for select
  to authenticated
  using (true);

create policy "Authenticated users can manage rotation"
  on public.picker_rotation for all
  to authenticated
  using (true)
  with check (true);

-- Seed the singleton row (member_order populated later, once members exist)
insert into public.picker_rotation (id, member_order, current_index)
values (1, '{}', 0);
