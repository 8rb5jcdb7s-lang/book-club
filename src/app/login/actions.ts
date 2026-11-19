'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type LoginState = { error?: string; message?: string; email?: string } | undefined

function friendlyAuthError(error: { message: string; status?: number; name?: string }): string {
  if (
    error.name === 'AuthRetryableFetchError' ||
    (error.status !== undefined && (error.status === 0 || error.status >= 500)) ||
    /fetch failed|failed to fetch|network/i.test(error.message)
  ) {
    return "Can't reach the database right now. If this keeps happening, the Supabase project may be paused and need restoring from its dashboard."
  }
  if (/invalid login credentials/i.test(error.message)) {
    return 'Wrong email or password.'
  }
  if (/signups? not allowed/i.test(error.message)) {
    return "That email isn't on the invite list."
  }
  return error.message
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const supabase = await createClient()

  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const intent = formData.get('intent')

  if (!email) return { error: 'Enter your email.' }

  if (intent === 'magic-link') {
    // Use the address the request actually came from, so links in the email
    // point at the deployed site rather than a hard-coded localhost.
    const requestHeaders = await headers()
    const origin =
      requestHeaders.get('origin') ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      'http://localhost:3000'

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        // Invite-only: a sign-in link must never create a new account.
        shouldCreateUser: false,
      },
    })

    if (error) return { error: friendlyAuthError(error), email }
    return { message: `Sign-in link sent to ${email}. Check your inbox.`, email }
  }

  if (!password) return { error: 'Enter your password, or use a sign-in link instead.', email }

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: friendlyAuthError(error), email }

  redirect('/')
}
