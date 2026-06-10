'use client'

import { useActionState } from 'react'
import { upsertRatingNote, type RatingFormState } from '@/lib/actions/ratings'

export default function RatingInput({
  bookId,
  initialRating,
  initialNotes,
}: {
  bookId: string
  initialRating: number | null
  initialNotes: string | null
}) {
  const [state, formAction, pending] = useActionState<RatingFormState, FormData>(
    upsertRatingNote,
    undefined
  )

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-stone-200 bg-white p-4">
      <input type="hidden" name="book_id" value={bookId} />
      <div>
        <label className="block text-sm font-medium text-stone-700">Your rating (1-10)</label>
        <input
          name="rating"
          type="number"
          min="1"
          max="10"
          defaultValue={initialRating ?? ''}
          className="mt-1 w-24 rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700">Your thoughts</label>
        <textarea
          name="notes"
          rows={3}
          defaultValue={initialNotes ?? ''}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-stone-700 hover:shadow-lg active:scale-95 transition-all disabled:opacity-50"
      >
        {pending ? 'Saving...' : 'Save'}
      </button>
    </form>
  )
}
