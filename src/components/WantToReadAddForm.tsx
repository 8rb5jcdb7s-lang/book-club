'use client'

import { useActionState } from 'react'
import { addToWantToRead, type BookFormState } from '@/lib/actions/books'

export default function WantToReadAddForm() {
  const [state, formAction, pending] = useActionState<BookFormState, FormData>(
    addToWantToRead,
    undefined
  )

  return (
    <form action={formAction} className="card p-4">
      <label htmlFor="want-title" className="label">
        Add a book to the list
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="want-title"
          name="title"
          placeholder="Book title"
          required
          readOnly={pending}
          className="input min-w-0 flex-1"
        />
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? 'Finding book…' : 'Add to list'}
        </button>
      </div>
      {state?.error ? (
        <p className="mt-2 text-sm text-red-600">{state.error}</p>
      ) : (
        <p className="hint">
          Cover, author and synopsis are filled in automatically. Add the author’s name if it finds the wrong book.
        </p>
      )}
    </form>
  )
}
