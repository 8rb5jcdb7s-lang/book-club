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
      className="order-3 -mx-1 flex w-full items-center gap-1 overflow-x-auto sm:order-none sm:mx-0 sm:w-auto"
    >
      {links.map((link) => {
        const isActive =
          link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? 'page' : undefined}
            className={`rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
              isActive
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-200/70 hover:text-stone-900'
            }`}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
