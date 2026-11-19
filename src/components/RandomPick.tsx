'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import BookCover from '@/components/BookCover'

type PickBook = { id: string; title: string; author: string | null; cover_url: string | null }

/** "Can't decide?" — shuffles through the list and lands on a random book. */
export default function RandomPick({ books }: { books: PickBook[] }) {
  const [current, setCurrent] = useState<PickBook | null>(null)
  const [spinning, setSpinning] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  function spin() {
    if (books.length === 0) return
    const winner = books[Math.floor(Math.random() * books.length)]
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion || books.length === 1) {
      setCurrent(winner)
      return
    }

    setSpinning(true)
    const steps = 14
    let step = 0
    const tick = () => {
      step += 1
      if (step >= steps) {
        setCurrent(winner)
        setSpinning(false)
        return
      }
      setCurrent(books[(step + books.indexOf(winner) + 1) % books.length])
      // Slow down towards the end, like a wheel coming to rest.
      timer.current = setTimeout(tick, 60 + step * 14)
    }
    tick()
  }

  return (
    <div className="card flex flex-wrap items-center gap-4 p-4">
      {current ? (
        <>
          <BookCover
            key={current.id}
            coverUrl={current.cover_url}
            title={current.title}
            author={current.author}
            className={`h-24 w-16 shrink-0 transition-opacity ${spinning ? 'opacity-60' : ''}`}
          />
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-accent">{spinning ? 'Shuffling…' : 'Fate has chosen'}</p>
            <p className="mt-0.5 line-clamp-2 font-serif text-xl leading-snug font-semibold text-stone-900">
              {current.title}
            </p>
            {current.author && <p className="text-sm text-stone-500">{current.author}</p>}
          </div>
          <div className="flex gap-2">
            {!spinning && (
              <Link href={`/books/${current.id}`} className="btn btn-primary">
                View book
              </Link>
            )}
            <button type="button" onClick={spin} disabled={spinning} className="btn btn-secondary">
              Spin again
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-stone-900">Can&apos;t decide what&apos;s next?</p>
            <p className="text-sm text-stone-500">
              Let chance pick one of the {books.length} books on the list.
            </p>
          </div>
          <button type="button" onClick={spin} className="btn btn-secondary">
            Pick one for us
          </button>
        </>
      )}
    </div>
  )
}
