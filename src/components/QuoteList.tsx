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
    <div className="space-y-4">
      {quotes.length === 0 ? (
        <p className="empty-state">No quotes saved yet. Add a line that stuck with you.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {quotes.map((q) => (
            <li key={q.id} className="card bg-amber-50 p-4">
              <blockquote className="font-serif leading-relaxed text-stone-800 italic">
                “{q.quote_text}”
              </blockquote>
              <div className="mt-2 flex items-center justify-between text-xs text-stone-500">
                <span>
                  Saved by {q.profile?.display_name ?? 'Unknown'}
                  {q.page_number ? ` · p. ${q.page_number}` : ''}
                </span>
                {q.user_id === currentUserId && (
                  <form
                    action={deleteQuote.bind(null, q.id)}
                    onSubmit={(e) => {
                      if (!confirm('Delete this quote?')) e.preventDefault()
                    }}
                  >
                    <button type="submit" className="font-medium hover:text-red-600">
                      Delete
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="card space-y-3 p-4">
        <input type="hidden" name="book_id" value={bookId} />
        <label htmlFor="quote_text" className="label">
          Add a favorite quote
        </label>
        <textarea
          id="quote_text"
          name="quote_text"
          rows={2}
          required
          placeholder="Type the quote here…"
          className="input"
        />
        <div className="flex items-center gap-2">
          <input
            name="page_number"
            type="number"
            inputMode="numeric"
            min="1"
            placeholder="Page #"
            aria-label="Page number"
            className="input w-24"
          />
          <button type="submit" disabled={pending} className="btn btn-primary">
            {pending ? 'Adding…' : 'Add quote'}
          </button>
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        </div>
      </form>
    </div>
  )
}
