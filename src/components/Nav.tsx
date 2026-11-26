import Link from 'next/link'
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
    <header className="sticky top-0 z-30 border-b-2 border-ink bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
            <rect width="32" height="32" rx="7" fill="#1c1917" />
            <path
              d="M16 10.5c-2-1.6-4.6-2.2-7.5-2v13c2.900-.2 5.500.4 7.500 2 2-1.600 4.600-2.200 7.500-2v-13c-2.900-.2-5.500.4-7.500 2z"
              fill="none"
              stroke="#faf8f4"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path d="M16 10.5v13" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span className="font-serif text-xl font-semibold text-stone-900">Book Club</span>
        </Link>

        <NavLinks />

        <div className="flex items-center gap-2 sm:ml-auto">
          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-sm font-bold text-stone-700 transition-colors hover:bg-stone-200/70"
            title="Your profile"
          >
            <Avatar
              name={profile?.display_name ?? user.email ?? '?'}
              url={profile?.avatar_url}
              size={7}
              showTooltip={false}
            />
            <span className="max-w-32 truncate">{profile?.display_name ?? 'Profile'}</span>
          </Link>
          <form action={logout} className="hidden sm:block">
            <button type="submit" className="btn btn-ghost btn-sm">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
