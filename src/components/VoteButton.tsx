'use client'

import { useOptimistic, useState, useTransition } from 'react'
import { setVote } from '@/lib/actions/votes'

/** Thumbs-up toggle for a book on the Want to Read list. */
export default function VoteButton({
  bookId,
  voted,
  voterNames,
}: {
  bookId: string
  voted: boolean
  /** Everyone who has voted for the book, the viewer included. */
  voterNames: string[]
}) {
  const [isPending, startTransition] = useTransition()
  const [failed, setFailed] = useState(false)
  const [optimisticVoted, setOptimisticVoted] = useOptimistic(voted)

  // Show the new count straight away, before the server has answered.
  const count = voterNames.length + (optimisticVoted === voted ? 0 : optimisticVoted ? 1 : -1)

  function toggle() {
    const next = !optimisticVoted
    setFailed(false)
    startTransition(async () => {
      setOptimisticVoted(next)
      const result = await setVote(bookId, next)
      if (result?.error) setFailed(true)
    })
  }

  const who = voterNames.length > 0 ? `Voted for by ${voterNames.join(', ')}` : 'No votes yet'

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-pressed={optimisticVoted}
      aria-label={optimisticVoted ? 'Remove your vote' : 'Vote for this book'}
      title={failed ? "Couldn't save your vote. Try again." : who}
      className={`btn btn-sm gap-1.5 tabular-nums disabled:opacity-100 ${
        optimisticVoted ? 'bg-sun hover:bg-amber-400' : 'btn-secondary'
      }`}
    >
      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true">
        <path
          d="M6.5 9 9.6 2.6c1.3 0 2.3 1 2.3 2.3v2.6h4c1 0 1.800.9 1.600 1.900l-1.100 6.200c-.2.8-.9 1.400-1.700 1.400H6.500m0-8v8m0-8H3.800c-.7 0-1.300.6-1.300 1.300v5.400c0 .7.6 1.300 1.300 1.300h2.700"
          fill={optimisticVoted ? '#fff' : 'none'}
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      {count}
    </button>
  )
}
