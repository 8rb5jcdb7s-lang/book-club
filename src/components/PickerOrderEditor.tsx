'use client'

import { useState, useTransition } from 'react'
import { updateRotation } from '@/lib/actions/rotation'
import type { Profile } from '@/lib/types'

export default function PickerOrderEditor({
  memberOrder,
  currentIndex,
  profiles,
}: {
  memberOrder: string[]
  currentIndex: number
  profiles: Profile[]
}) {
  const profileMap = new Map(profiles.map((p) => [p.id, p.display_name]))

  // Start with the saved order, then append any profiles not yet in the rotation.
  const initialOrder = [
    ...memberOrder.filter((id) => profileMap.has(id)),
    ...profiles.map((p) => p.id).filter((id) => !memberOrder.includes(id)),
  ]

  const [order, setOrder] = useState(initialOrder)
  const [nextId, setNextId] = useState<string | null>(
    memberOrder[currentIndex] ?? initialOrder[0] ?? null
  )
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<{ saved?: boolean; error?: string }>({})

  function move(index: number, direction: -1 | 1) {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= order.length) return
    const next = [...order]
    ;[next[index], next[newIndex]] = [next[newIndex], next[index]]
    setOrder(next)
    setStatus({})
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateRotation(order, nextId)
      setStatus(result?.error ? { error: result.error } : { saved: true })
    })
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-ghost btn-sm">
        Edit order
      </button>
    )
  }

  return (
    <div className="mt-4 w-full space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
      <div>
        <p className="text-sm font-semibold text-stone-900">Edit the pick order</p>
        <p className="hint mt-0">
          Use the arrows to reorder, and choose whose turn it is next.
        </p>
      </div>
      <ol className="space-y-1.5">
        {order.map((id, i) => (
          <li
            key={id}
            className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm"
          >
            <span className="w-4 text-xs text-stone-400 tabular-nums">{i + 1}</span>
            <span className="flex-1 font-medium text-stone-800">
              {profileMap.get(id) ?? 'Unknown'}
            </span>
            <label className="flex items-center gap-1.5 text-xs text-stone-600">
              <input
                type="radio"
                name="next-picker"
                checked={nextId === id}
                onChange={() => {
                  setNextId(id)
                  setStatus({})
                }}
                className="accent-amber-600"
              />
              Next up
            </label>
            <span className="flex gap-0.5">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label={`Move ${profileMap.get(id) ?? 'member'} up`}
                className="rounded px-2 py-0.5 text-stone-500 hover:bg-stone-100 disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === order.length - 1}
                aria-label={`Move ${profileMap.get(id) ?? 'member'} down`}
                className="rounded px-2 py-0.5 text-stone-500 hover:bg-stone-100 disabled:opacity-30"
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
          className="btn btn-primary btn-sm"
        >
          {isPending ? 'Saving…' : 'Save order'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">
          Close
        </button>
        {status.saved && <span className="text-xs font-medium text-emerald-700">Saved ✓</span>}
        {status.error && <span className="text-xs text-red-600">{status.error}</span>}
      </div>
    </div>
  )
}
