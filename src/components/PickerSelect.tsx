'use client'

import { useState, useTransition } from 'react'
import { updatePicker } from '@/lib/actions/books'
import Avatar from '@/components/Avatar'

type Member = { id: string; display_name: string; avatar_url: string | null }

/** Shows who picked a book, with a "Change" control to correct it in place. */
export default function PickerSelect({
  bookId,
  pickedBy,
  members,
}: {
  bookId: string
  pickedBy: string | null
  members: Member[]
}) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const current = members.find((m) => m.id === pickedBy) ?? null

  if (editing) {
    return (
      <span className="flex flex-wrap items-center gap-2">
        <select
          autoFocus
          aria-label="Who picked this book"
          defaultValue={pickedBy ?? ''}
          disabled={isPending}
          onChange={(e) => {
            const value = e.target.value || null
            startTransition(async () => {
              const result = await updatePicker(bookId, value)
              setError(result?.error ?? null)
              if (!result?.error) setEditing(false)
            })
          }}
          className="input w-auto py-1"
        >
          <option value="">Nobody</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.display_name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-xs font-medium text-stone-500 hover:text-stone-900"
        >
          {isPending ? 'Saving…' : 'Cancel'}
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </span>
    )
  }

  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {current ? (
        <span className="flex items-center gap-1.5">
          <Avatar
            name={current.display_name}
            url={current.avatar_url}
            size={5}
            showTooltip={false}
          />
          {current.display_name}
        </span>
      ) : (
        <span className="text-stone-400">Not set</span>
      )}
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs font-medium text-accent hover:underline"
      >
        Change
      </button>
    </span>
  )
}
