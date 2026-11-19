'use client'

import { useState, useTransition } from 'react'
import { startReading } from '@/lib/actions/books'

type Member = { id: string; display_name: string }

/**
 * "Start reading" for a book on the want-to-read list. Asks whose pick it
 * counts as (defaulting to whoever is due) before making it the current book.
 */
export default function StartReadingButton({
  bookId,
  members,
  suggestedPickerId,
  className = 'btn btn-secondary btn-sm',
}: {
  bookId: string
  members: Member[]
  suggestedPickerId: string | null
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [pickerId, setPickerId] = useState(suggestedPickerId ?? '')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={className}>
        Start reading
      </button>
    )
  }

  return (
    <div className="w-full space-y-2 rounded-lg border border-stone-200 bg-stone-50 p-2.5">
      <label className="block text-xs font-medium text-stone-600">
        Whose pick is this?
        <select
          value={pickerId}
          onChange={(e) => setPickerId(e.target.value)}
          disabled={isPending}
          className="input mt-1 py-1.5"
        >
          <option value="">Leave as is</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.display_name}
              {m.id === suggestedPickerId ? ' (due)' : ''}
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs text-stone-500">The current book, if any, moves to History.</p>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await startReading(bookId, pickerId || null)
              setError(result?.error ?? null)
            })
          }
          className="btn btn-primary btn-sm"
        >
          {isPending ? 'Starting…' : 'Start'}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => setOpen(false)}
          className="btn btn-ghost btn-sm"
        >
          Cancel
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
