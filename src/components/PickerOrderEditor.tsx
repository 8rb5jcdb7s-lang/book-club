'use client'

import { useState, useTransition } from 'react'
import { updateRotationOrder } from '@/lib/actions/rotation'
import type { Profile } from '@/lib/types'

export default function PickerOrderEditor({
  memberOrder,
  profiles,
}: {
  memberOrder: string[]
  profiles: Profile[]
}) {
  const profileMap = new Map(profiles.map((p) => [p.id, p.display_name]))

  // Start with the saved order, then append any profiles not yet in the rotation.
  const initialOrder = [
    ...memberOrder.filter((id) => profileMap.has(id)),
    ...profiles.map((p) => p.id).filter((id) => !memberOrder.includes(id)),
  ]

  const [order, setOrder] = useState(initialOrder)
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function move(index: number, direction: -1 | 1) {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= order.length) return
    const next = [...order]
    ;[next[index], next[newIndex]] = [next[newIndex], next[index]]
    setOrder(next)
    setSaved(false)
  }

  function handleSave() {
    startTransition(async () => {
      await updateRotationOrder(order)
      setSaved(true)
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 text-xs text-stone-500 hover:text-stone-900 hover:underline"
      >
        Edit pick order
      </button>
    )
  }

  return (
    <div className="mt-3 space-y-2 rounded-md border border-stone-200 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
        Pick order
      </p>
      <ol className="space-y-1">
        {order.map((id, i) => (
          <li
            key={id}
            className="flex items-center justify-between rounded-md bg-stone-50 px-2 py-1 text-sm"
          >
            <span>
              {i + 1}. {profileMap.get(id) ?? 'Unknown'}
            </span>
            <span className="flex gap-1">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="rounded px-2 py-0.5 text-stone-500 hover:bg-stone-200 disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === order.length - 1}
                className="rounded px-2 py-0.5 text-stone-500 hover:bg-stone-200 disabled:opacity-30"
              >
                ↓
              </button>
            </span>
          </li>
        ))}
      </ol>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-stone-700 hover:shadow-md active:scale-95 transition-all disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save order'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-stone-500 hover:underline"
        >
          Close
        </button>
        {saved && <span className="text-xs text-green-700">Saved!</span>}
      </div>
    </div>
  )
}
