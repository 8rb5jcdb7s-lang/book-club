'use client'

import { useState, useTransition } from 'react'
import { markFinished, unmarkFinished } from '@/lib/actions/finishes'

const CONFETTI_COLORS = ['#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#a855f7', '#1c1917']

type Piece = { id: number; dx: number; dy: number; rot: number; color: string }

function makeConfetti(): Piece[] {
  return Array.from({ length: 18 }, (_, i) => {
    const angle = (i / 18) * Math.PI * 2 + Math.random() * 0.4
    const distance = 40 + Math.random() * 50
    return {
      id: i,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance - 20,
      rot: Math.random() * 540 - 270,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    }
  })
}

/** Per-member "I've finished reading" toggle for the current book. */
export default function FinishButton({
  bookId,
  isFinished,
}: {
  bookId: string
  isFinished: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [confetti, setConfetti] = useState<Piece[]>([])

  function handleClick() {
    if (!isFinished && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setConfetti(makeConfetti())
      setTimeout(() => setConfetti([]), 900)
    }
    startTransition(() => (isFinished ? unmarkFinished(bookId) : markFinished(bookId)))
  }

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        disabled={isPending}
        aria-pressed={isFinished}
        title={isFinished ? 'Click to undo' : 'Let everyone know you are ready to discuss'}
        onClick={handleClick}
        className={`btn ${
          isFinished
            ? 'bg-emerald-200 hover:bg-emerald-300'
            : 'btn-primary'
        }`}
      >
        {isPending ? 'Updating…' : isFinished ? '✓ You’ve finished' : 'I finished it!'}
      </button>
      <span className="pointer-events-none absolute top-1/2 left-1/2" aria-hidden="true">
        {confetti.map((piece) => (
          <span
            key={piece.id}
            className="absolute h-2 w-1.5 rounded-[1px]"
            style={
              {
                backgroundColor: piece.color,
                '--dx': `${piece.dx}px`,
                '--dy': `${piece.dy}px`,
                '--rot': `${piece.rot}deg`,
                animation: 'confetti-burst 0.85s cubic-bezier(0.15, 0.8, 0.3, 1) forwards',
              } as React.CSSProperties
            }
          />
        ))}
      </span>
    </span>
  )
}
