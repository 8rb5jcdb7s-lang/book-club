import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/logout/actions'
import AvatarUploader from '@/components/AvatarUploader'
import { DisplayNameForm, EmailToggle, PasswordForm } from '@/components/ProfileForms'

export const metadata: Metadata = { title: 'Your profile' }

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
