'use client'

import { useActionState, useRef } from 'react'
import { addToWantToRead, type BookFormState } from '@/lib/actions/books'

export default function WantToReadAddForm() {
  const [state, formAction, pending] = useActionState<BookFormState, FormData>(
    addToWantToRead,
    undefined
  )
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <form
      ref={formRef}
      action={(formData) => {
        formAction(formData)
        formRef.current?.reset()
      }}
      className="flex flex-wrap items-start gap-2"
    >
      <input
        name="title"
        placeholder="Book title"
        required
        className="rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-stone-700 hover:shadow-lg active:scale-95 transition-all disabled:opacity-50"
      >
        {pending ? 'Adding...' : 'Add to list'}
      </button>
      {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  )
}
