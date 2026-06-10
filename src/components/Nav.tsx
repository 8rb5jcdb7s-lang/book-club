import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/logout/actions'
import Avatar from '@/components/Avatar'
import NavLinks from '@/components/NavLinks'

export default async function Nav() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <header className="border-b border-stone-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <NavLinks />
        <div className="flex items-center gap-3">
          {profile && (
            <Avatar name={profile.display_name} url={profile.avatar_url} size={8} />
          )}
          <form action={logout}>
            <button
              type="submit"
              className="text-sm font-semibold text-stone-500 transition-colors hover:text-stone-900"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
