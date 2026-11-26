import { createClient } from '@supabase/supabase-js'
import { notifyLastToRate } from '@/lib/notifications'

// Called once a day by Vercel Cron (see vercel.json). Two jobs:
//  1. Keep Supabase awake: free-tier projects pause after 7 days without
//     activity, so this makes sure the database always sees traffic.
//  2. Send the "you're the only one who hasn't rated" nudge, which waits a
//     couple of days and so can't be sent at the moment someone rates.
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

  // A failed nudge must never make the keep-alive look broken.
  let nudges = 0
  try {
    const configured = process.env.NEXT_PUBLIC_SITE_URL
    const siteUrl =
      configured && !/localhost|127\.0\.0\.1/.test(configured)
        ? configured.replace(/\/$/, '')
        : new URL(request.url).origin
    nudges = await notifyLastToRate(siteUrl)
  } catch (e) {
    console.error('[keep-alive] nudge check failed', e)
  }

  return Response.json({ ok: true, at: new Date().toISOString(), nudges })
}
