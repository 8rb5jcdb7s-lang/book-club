import { createClient } from '@supabase/supabase-js'

// Supabase pauses free-tier projects after 7 days without activity.
// Vercel Cron calls this route once a day (see vercel.json) so the database
// always sees traffic, even when nobody opens the app for a while.
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // If CRON_SECRET is set in Vercel, Vercel Cron sends it as a bearer token;
  // require it so the route can't be triggered by anyone else.
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  // A real query against Postgres (not just a ping of the API gateway).
  const { error } = await supabase.from('picker_rotation').select('id').limit(1)

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 503 })
  }

  return Response.json({ ok: true, at: new Date().toISOString() })
}
