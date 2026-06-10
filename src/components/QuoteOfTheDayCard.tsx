'use client'

import { useEffect, useState } from 'react'
import { FEATURED_QUOTES, type FeaturedQuote } from '@/lib/featuredQuotes'

const HISTORY_KEY = 'quoteOfTheDayHistory'
const HISTORY_LIMIT = Math.floor(FEATURED_QUOTES.length * 0.6)

function pickQuote(): FeaturedQuote {
  let history: number[] = []
  try {
    history = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')
  } catch {
    history = []
  }

  let candidates = FEATURED_QUOTES.map((_, i) => i).filter((i) => !history.includes(i))
  if (candidates.length === 0) {
    candidates = FEATURED_QUOTES.map((_, i) => i)
    history = []
  }

  const index = candidates[Math.floor(Math.random() * candidates.length)]
  const nextHistory = [...history, index].slice(-HISTORY_LIMIT)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory))

  return FEATURED_QUOTES[index]
}

function renderQuote(quote: FeaturedQuote) {
  const idx = quote.quote.indexOf(quote.highlight)
  if (idx === -1) return quote.quote

  return (
    <>
      {quote.quote.slice(0, idx)}
      <strong className="font-bold text-stone-900">
        {quote.quote.slice(idx, idx + quote.highlight.length)}
      </strong>
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
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-stone-500">Quote</p>
      {quote ? (
        <>
          <p className="mt-2 italic text-stone-800">&ldquo;{renderQuote(quote)}&rdquo;</p>
          <p className="mt-3 text-xs text-stone-500">
            — {quote.author}, <span className="italic">{quote.source}</span>
          </p>
        </>
      ) : (
        <div className="mt-2 space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-stone-100" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-stone-100" />
        </div>
      )}
    </div>
  )
}
