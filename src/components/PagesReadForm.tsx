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
  const [value, setValue] = useState(String(pagesReadSoFar))
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const parsed = parseInt(value, 10)
  const unchanged = parsed === pagesReadSoFar

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!Number.isFinite(parsed)) return
        const pages = pageCount ? Math.min(parsed, pageCount) : parsed
        setValue(String(pages))
        startTransition(async () => {
          const result = await updatePagesRead(bookId, pages)
          setError(result?.error ?? null)
        })
      }}
      className="flex flex-wrap items-center gap-2 text-sm"
    >
      <label htmlFor="pages_read" className="text-stone-600">
        We&apos;re on page
      </label>
      <input
        id="pages_read"
        type="number"
        inputMode="numeric"
        min="0"
        max={pageCount ?? undefined}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="input w-20 px-2 py-1 text-center tabular-nums"
      />
      {pageCount && <span className="text-stone-500">of {pageCount}</span>}
      <button
        type="submit"
        disabled={isPending || unchanged || !Number.isFinite(parsed)}
        className="btn btn-secondary btn-sm"
      >
        {isPending ? 'Saving…' : 'Update'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  )
}
