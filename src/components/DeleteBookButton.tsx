'use client'

import { useTransition } from 'react'
import { deleteBook } from '@/lib/actions/books'

export default function DeleteBookButton({ bookId, label = 'Remove' }: { bookId: string; label?: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (confirm('Remove this book? This cannot be undone.')) {
          startTransition(() => deleteBook(bookId))
        }
      }}
      className="text-xs text-stone-400 hover:text-red-600 disabled:opacity-50"
    >
      {isPending ? 'Removing...' : label}
    </button>
  )
}
