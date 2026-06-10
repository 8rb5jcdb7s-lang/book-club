'use client'

import { useState, useTransition } from 'react'
import { updatePagesRead } from '@/lib/actions/books'

export default function PagesReadForm({
  bookId,
  pagesReadSoFar,
  pageCount,
}: {
  bookId: string
  pagesReadSoFar: number
  pageCount: number | null
}) {
  const [value, setValue] = useState(pagesReadSoFar)
  const [isPending, startTransition] = useTransition()

  return (
    <form
      action={() => startTransition(() => updatePagesRead(bookId, value))}
      className="flex items-center gap-2 text-sm"
    >
      <label htmlFor="pages_read" className="text-stone-600">
        Pages read so far:
      </label>
      <input
        id="pages_read"
        type="number"
        min="0"
        max={pageCount ?? undefined}
        value={value}
        onChange={(e) => setValue(parseInt(e.target.value || '0', 10))}
        className="w-20 rounded-md border border-stone-300 px-2 py-1 text-sm focus:border-stone-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md border border-stone-300 px-2 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
      >
        {isPending ? 'Saving...' : 'Update'}
      </button>
    </form>
  )
}
