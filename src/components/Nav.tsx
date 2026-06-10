import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/logout/actions'
import NavLinks from '@/components/NavLinks'

export default async function Nav() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  return (
    <header className="border-b border-stone-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
        <NavLinks />
        <form action={logout}>
          <button
            type="submit"
            className="text-sm font-semibold text-stone-500 transition-colors hover:text-stone-900"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  )
}
