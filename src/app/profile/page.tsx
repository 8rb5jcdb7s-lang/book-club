import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logout } from '@/app/logout/actions'
import { CLUB_TIME_ZONE } from '@/lib/dates'
import AvatarUploader from '@/components/AvatarUploader'
import {
  DisplayNameForm,
  EmailToggle,
  PasswordForm,
  TestEmailButton,
} from '@/components/ProfileForms'

export const metadata: Metadata = { title: 'Your profile' }

const EMAIL_KINDS: Record<string, string> = {
  book_started: 'New book',
  finished: 'Someone finished',
  last_to_rate: 'Rating nudge',
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  // The email log is only readable with the secret key (members can't query
  // it directly), so it is fetched here on the server.
  type EmailLogRow = {
    id: string
    kind: string
    sent_at: string
    sent_count?: number | null
    failed_count?: number | null
    error?: string | null
    book: { title: string } | null
  }
  let recentEmails: EmailLogRow[] = []
  const admin = createAdminClient()
  if (admin) {
    const { data } = await admin
      .from('email_log')
      .select('*, book:books(title)')
      .order('sent_at', { ascending: false })
      .limit(5)
    recentEmails = (data as unknown as EmailLogRow[] | null) ?? []
  }

  const displayName = profile?.display_name ?? user.email?.split('@')[0] ?? 'Member'

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="page-title">Your profile</h1>
        <p className="mt-1 text-sm text-stone-500">Signed in as {user.email}</p>
      </div>

      <section className="card space-y-6 p-5 sm:p-6">
        <AvatarUploader userId={user.id} name={displayName} url={profile?.avatar_url ?? null} />
        <hr className="border-stone-100" />
        <DisplayNameForm displayName={displayName} />
      </section>

      <section className="card space-y-3 p-5 sm:p-6">
        <h2 className="section-title">Emails</h2>
        <EmailToggle enabled={profile?.email_notifications !== false} />
        <TestEmailButton />
        {recentEmails.length > 0 && (
          <div className="panel px-4 py-3">
            <p className="eyebrow">Recent club emails</p>
            <ul className="mt-2 space-y-2 text-sm">
              {recentEmails.map((email) => {
                const failed = email.failed_count ?? 0
                const sent = email.sent_count
                return (
                  <li key={email.id} className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="min-w-0">
                      <span className="font-bold text-ink">
                        {EMAIL_KINDS[email.kind] ?? email.kind}
                      </span>
                      {email.book?.title && (
                        <span className="text-stone-600"> · {email.book.title}</span>
                      )}
                      <span className="text-stone-400">
                        {' '}
                        ·{' '}
                        {new Date(email.sent_at).toLocaleString('en-US', {
                          timeZone: CLUB_TIME_ZONE,
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </span>
                    {failed > 0 ? (
                      <span className="font-bold text-red-600">
                        {failed} failed{sent ? `, ${sent} sent` : ''}
                        {email.error ? ` — ${email.error}` : ''}
                      </span>
                    ) : sent != null ? (
                      <span className="font-bold text-emerald-700">Sent to {sent}</span>
                    ) : (
                      <span className="text-stone-400">Sent</span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </section>

      <section className="card space-y-3 p-5 sm:p-6">
        <div>
          <h2 className="section-title">Password</h2>
          <p className="text-sm text-stone-500">
            Set or change your password. You can always sign in with an emailed link instead.
          </p>
        </div>
        <PasswordForm />
      </section>

      <form action={logout}>
        <button type="submit" className="btn btn-secondary">
          Sign out
        </button>
      </form>
    </div>
  )
}
