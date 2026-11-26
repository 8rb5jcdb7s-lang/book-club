import { createClient } from '@supabase/supabase-js'

/**
 * A Supabase client with the secret key, for server-only work that members'
 * own sessions can't do (reading everyone's email address, writing the email
 * log). Returns null when the key isn't configured. Never import this from a
 * client component.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) return null

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
