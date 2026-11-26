'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Home' },
  { href: '/books', label: 'History' },
  { href: '/want-to-read', label: 'Want to Read' },
  { href: '/stats', label: 'Stats' },
]

export default function NavLinks() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Main"
      className="order-3 no-scrollbar -mx-1 flex w-full items-center gap-1 overflow-x-auto px-1 pb-1 sm:order-none sm:mx-0 sm:w-auto"
    >
      {links.map((link) => {
        const isActive =
          link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? 'page' : undefined}
            className={`rounded-full border-2 px-3 py-1 text-sm font-extrabold whitespace-nowrap transition-colors ${
              isActive
                ? 'border-ink bg-sun text-ink shadow-[0_2px_0_0_var(--color-ink)]'
                : 'border-transparent text-stone-600 hover:bg-stone-200/70 hover:text-ink'
            }`}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
