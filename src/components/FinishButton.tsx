'use client'

import { useTransition } from 'react'
import { markFinished, unmarkFinished } from '@/lib/actions/finishes'

export default function FinishButton({
  bookId,
  isFinished,
}: {
  bookId: string
  isFinished: boolean
}) {
  const [isPending, startTransition] = useTransition()

  if (isFinished) {
    return (
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => unmarkFinished(bookId))}
        className="rounded-lg border-2 border-stone-300 px-4 py-2 text-sm font-bold text-stone-700 shadow-sm hover:bg-stone-100 hover:shadow-md active:scale-95 transition-all disabled:opacity-50"
      >
        {isPending ? 'Updating...' : "✓ You're done"}
      </button>
    )
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => markFinished(bookId))}
      className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-stone-700 hover:shadow-lg active:scale-95 transition-all disabled:opacity-50"
    >
      {isPending ? 'Updating...' : 'I finished!'}
    </button>
  )
}
