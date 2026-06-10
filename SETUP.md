# Setup

## 1. Create a Supabase project

1. Go to https://supabase.com and create a free account/project.
2. In the project dashboard, go to **Project Settings > API**.
3. Copy the **Project URL** and the **anon public** key.

## 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in the values from step 1:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 3. Apply the database schema

1. In the Supabase dashboard, go to **SQL Editor > New query**.
2. Paste the contents of `supabase/schema.sql` and run it.

This creates the `profiles`, `books`, `ratings_notes`, `quotes`, and `picker_rotation` tables, sets up row-level security, and adds a trigger that auto-creates a profile when someone signs up.

## 4. Invite your friends (invite-only signup)

1. In the Supabase dashboard, go to **Authentication > Users > Add user > Invite user**.
2. Enter each friend's email. They'll get an email with a link to set their password.
3. Each invited user automatically gets a row in `profiles` (via the trigger), with `display_name` defaulting to the part of their email before `@`. They can update their display name later if desired.

## 5. Set up the picker rotation order

Once everyone has signed up, find each person's `id` in **Table Editor > profiles**, then run this in the SQL Editor (replace with your actual user IDs in the order you want them to pick):

```sql
update public.picker_rotation
set member_order = array['uuid-1', 'uuid-2', 'uuid-3']::uuid[],
    current_index = 0
where id = 1;
```

## 6. Run the app

```bash
npm run dev
```

Visit http://localhost:3000 and sign in.
