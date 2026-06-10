'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Book Club' },
  { href: '/books', label: 'History' },
  { href: '/stats', label: 'Stats' },
]

export default function NavLinks() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-6 text-base text-stone-700">
      {links.map((link) => {
        const isActive = pathname === link.href
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-md px-2 py-1 transition-transform duration-150 hover:scale-110 hover:text-stone-900 ${
              isActive ? 'font-extrabold text-stone-900' : 'font-bold'
            }`}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
