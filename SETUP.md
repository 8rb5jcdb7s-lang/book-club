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

## 7. Database updates (run once each, in the Supabase SQL Editor)

Features added after the initial schema live in `supabase/migrations/`. Run any you
haven't yet:

- `add_avatars.sql` — profile pictures
- `add_book_finishes.sql` — "I finished it!" / ready to discuss
- `add_book_synopsis.sql`, `add_book_links.sql` — synopsis and Goodreads/Amazon links
- `add_did_not_finish.sql` — lets a member mark a book "did not finish" instead of rating it
- `add_half_point_ratings.sql` — allows ratings in half-point steps (7.5)
- `add_email_notifications.sql` — email on/off switch per member, and the log that stops repeat emails
- `add_email_log_outcome.sql` — records how many of each email were sent or failed (shown on the profile page)

## 8. Keeping Supabase awake

Free Supabase projects pause after 7 days without activity. To prevent that,
`vercel.json` schedules a daily Vercel Cron job that calls `/api/keep-alive`, which
runs a small query against the database. Nothing to configure — it starts working
on the next deploy. You can check it under **Vercel > Project > Settings > Cron Jobs**,
or by opening `https://<your-site>/api/keep-alive` (it should return `{"ok":true}`).

Optional: set a `CRON_SECRET` environment variable in Vercel to stop anyone else
from calling that URL.

## 9. Time zone

"Today" (for start/finish dates and the pages-per-day pace) is worked out in
`America/Los_Angeles`. To change it, set `NEXT_PUBLIC_CLUB_TIME_ZONE` (e.g.
`America/New_York`) in Vercel and `.env.local`.

## 10. Email notifications

The site sends three kinds of email, each at most once per book (and per person):
a new book was started, someone pressed "I finished it!", and "you're the only one
who hasn't rated" (sent by the daily cron job, only once everyone else has been done
for two days, and only for books finished in the last 45 days). Members can switch
them off on their profile page.

Emails go out through a Gmail account using an **app password** (not the account's
normal password):

1. Sign in to the Gmail account, turn on 2-Step Verification
   (https://myaccount.google.com/security), then create an app password at
   https://myaccount.google.com/apppasswords.
2. In **Vercel > Project > Settings > Environment Variables**, add:
   - `GMAIL_USER` — the Gmail address
   - `GMAIL_APP_PASSWORD` — the 16-character app password
   - `SUPABASE_SECRET_KEY` — the secret key from **Supabase > Project Settings > API keys**
     (needed to look up members' email addresses)
   - `NEXT_PUBLIC_SITE_URL` — the site's address, e.g. `https://book-club-sage.vercel.app`
3. Run `supabase/migrations/add_email_notifications.sql` in the Supabase SQL editor.
4. Redeploy so the new variables take effect.

Until all of that is done, no emails are sent and nothing else is affected. When
running locally without the Gmail variables, emails are printed to the terminal
instead of being sent.
