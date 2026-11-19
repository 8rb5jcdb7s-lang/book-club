'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center py-20 text-center">
      <h1 className="page-title">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-stone-500">
        The page couldn&apos;t load. This is usually a brief hiccup talking to the database —
        try again in a moment.
      </p>
      <button type="button" onClick={() => unstable_retry()} className="btn btn-primary mt-6">
        Try again
      </button>
    </div>
  )
}
