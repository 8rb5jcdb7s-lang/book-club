'use client'

import { useActionState } from 'react'
import { addQuote, deleteQuote, type QuoteFormState } from '@/lib/actions/quotes'
import type { Quote } from '@/lib/types'

type Row = Quote & { profile?: { display_name: string } | null }

export default function QuoteList({
  bookId,
  quotes,
  currentUserId,
}: {
  bookId: string
  quotes: Row[]
  currentUserId: string
}) {
  const [state, formAction, pending] = useActionState<QuoteFormState, FormData>(
    addQuote,
    undefined
  )

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {quotes.map((q) => (
          <li
            key={q.id}
            className="rounded-lg border border-stone-200 bg-white p-3 text-sm"
          >
            <p className="italic text-stone-800">&ldquo;{q.quote_text}&rdquo;</p>
            <div className="mt-1 flex items-center justify-between text-xs text-stone-500">
              <span>
                — {q.profile?.display_name ?? 'Unknown'}
                {q.page_number ? `, p. ${q.page_number}` : ''}
              </span>
              {q.user_id === currentUserId && (
                <form action={deleteQuote.bind(null, q.id, bookId)}>
                  <button type="submit" className="hover:text-red-600">
                    Delete
                  </button>
                </form>
              )}
            </div>
          </li>
        ))}
        {quotes.length === 0 && (
          <p className="text-sm text-stone-500">No quotes saved yet.</p>
        )}
      </ul>

      <form action={formAction} className="space-y-2 rounded-lg border border-stone-200 bg-white p-3">
        <input type="hidden" name="book_id" value={bookId} />
        <textarea
          name="quote_text"
          rows={2}
          placeholder="Add a favorite quote..."
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
        />
        <div className="flex items-center gap-2">
          <input
            name="page_number"
            type="number"
            min="1"
            placeholder="Page #"
            className="w-24 rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-stone-700 hover:shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {pending ? 'Adding...' : 'Add quote'}
          </button>
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      </form>
    </div>
  )
}
