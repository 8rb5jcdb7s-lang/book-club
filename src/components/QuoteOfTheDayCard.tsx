'use client'

import { useEffect, useState } from 'react'
import { FEATURED_QUOTES, type FeaturedQuote } from '@/lib/featuredQuotes'

const HISTORY_KEY = 'quoteOfTheDayHistory'
const HISTORY_LIMIT = Math.floor(FEATURED_QUOTES.length * 0.6)

function pickQuote(): FeaturedQuote {
  let history: number[] = []
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')
    if (Array.isArray(parsed)) history = parsed
  } catch {
    history = []
  }

  let candidates = FEATURED_QUOTES.map((_, i) => i).filter((i) => !history.includes(i))
  if (candidates.length === 0) {
    candidates = FEATURED_QUOTES.map((_, i) => i)
    history = []
  }

  const index = candidates[Math.floor(Math.random() * candidates.length)]
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify([...history, index].slice(-HISTORY_LIMIT)))
  } catch {
    // Private browsing / storage disabled: just don't track repeats.
  }

  return FEATURED_QUOTES[index]
}

function renderQuote(quote: FeaturedQuote) {
  const idx = quote.quote.indexOf(quote.highlight)
  if (idx === -1) return quote.quote

  return (
    <>
      {quote.quote.slice(0, idx)}
      <mark className="rounded bg-accent-soft px-0.5 font-semibold text-stone-900 not-italic">
        {quote.quote.slice(idx, idx + quote.highlight.length)}
      </mark>
      {quote.quote.slice(idx + quote.highlight.length)}
    </>
  )
}

export default function QuoteOfTheDayCard() {
  const [quote, setQuote] = useState<FeaturedQuote | null>(null)

  useEffect(() => {
    // Reads/writes localStorage, so this must run client-side only after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuote(pickQuote())
  }, [])

  return (
    <div className="card relative overflow-hidden p-5 sm:p-6">
      <span
        className="pointer-events-none absolute -top-4 right-3 font-serif text-8xl leading-none text-stone-100 select-none"
        aria-hidden="true"
      >
        ”
      </span>
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="eyebrow">A quote for the club</p>
          <button
            type="button"
            onClick={() => setQuote(pickQuote())}
            className="btn btn-ghost btn-sm -mr-2"
            title="Show another quote"
          >
            Another
          </button>
        </div>
        {quote ? (
          <figure>
            <blockquote className="mt-3 max-h-64 overflow-y-auto font-serif text-lg leading-relaxed text-stone-700 italic">
              “{renderQuote(quote)}”
            </blockquote>
            <figcaption className="mt-3 text-xs text-stone-500">
              — {quote.author}, <cite>{quote.source}</cite>
            </figcaption>
          </figure>
        ) : (
          <div className="mt-4 space-y-2.5">
            <div className="h-4 w-full animate-pulse rounded bg-stone-100" />
            <div className="h-4 w-11/12 animate-pulse rounded bg-stone-100" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-stone-100" />
          </div>
        )}
      </div>
    </div>
  )
}
