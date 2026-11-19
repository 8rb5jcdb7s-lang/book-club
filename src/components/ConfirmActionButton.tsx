'use client'

import { useState, useTransition } from 'react'

/**
 * A button that asks for confirmation, runs a server action, and shows any
 * error the action returns.
 */
export default function ConfirmActionButton({
  action,
  confirmMessage,
  children,
  pendingLabel = 'Working…',
  className = 'btn btn-secondary',
}: {
  action: () => Promise<{ error?: string } | undefined | void>
  confirmMessage?: string
  children: React.ReactNode
  pendingLabel?: string
  className?: string
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (confirmMessage && !confirm(confirmMessage)) return
          startTransition(async () => {
            const result = await action()
            setError(result?.error ?? null)
          })
        }}
        className={className}
      >
        {isPending ? pendingLabel : children}
      </button>
      {error && (
        <span role="alert" className="text-xs text-red-600">
          {error}
        </span>
      )}
    </>
  )
}
