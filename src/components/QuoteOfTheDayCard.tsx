'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Avatar from '@/components/Avatar'
import { FEATURED_QUOTES, type FeaturedQuote } from '@/lib/featuredQuotes'

type Member = { display_name: string; avatar_url: string | null }
type Name = FeaturedQuote['name']

const NAMES: Name[] = ['Miles', 'Gus', 'Henry', 'Noah']
const HISTORY_KEY = 'quoteOfTheDayHistory'
const SCORE_KEY = 'quoteGuessScore'
const AUTHORS = [...new Set(FEATURED_QUOTES.map((q) => q.author))]

function readJson<T>(key: string, fallback: T): T {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? 'null')
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Private browsing / storage disabled: just don't remember.
  }
}

/** The same quote for everyone in the club on a given day. */
function quoteOfTheDayIndex(): number {
  const now = new Date()
  const key = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
  let hash = 0
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return hash % FEATURED_QUOTES.length
}

/** A random quote (optionally about one person), avoiding recent repeats. */
function randomIndex(filter: Name | null, current: number | null): number {
  const pool = FEATURED_QUOTES.map((_, i) => i).filter(
    (i) => !filter || FEATURED_QUOTES[i].name === filter
  )
  const limit = Math.floor(pool.length * 0.6)
  let history = readJson<number[]>(HISTORY_KEY, []).filter((i) => pool.includes(i))
  let candidates = pool.filter((i) => !history.includes(i) && i !== current)
  if (candidates.length === 0) {
    candidates = pool.filter((i) => i !== current)
    history = []
  }
  const index = candidates[Math.floor(Math.random() * candidates.length)] ?? pool[0]
  // Keep other names' history too, so switching filters doesn't forget it.
  const others = readJson<number[]>(HISTORY_KEY, []).filter((i) => !pool.includes(i))
  writeJson(HISTORY_KEY, [...others, ...[...history, index].slice(-limit)])
  return index
}

/** The right author plus two wrong ones, shuffled. */
function authorChoices(correct: string): string[] {
  const wrong = AUTHORS.filter((a) => a !== correct)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2)
  return [correct, ...wrong].sort(() => Math.random() - 0.5)
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

export default function QuoteOfTheDayCard({ members = [] }: { members?: Member[] }) {
  const [index, setIndex] = useState<number | null>(null)
  const [isDaily, setIsDaily] = useState(true)
  const [filter, setFilter] = useState<Name | null>(null)
  const [choices, setChoices] = useState<string[]>([])
  const [guess, setGuess] = useState<string | null>(null)
  const [score, setScore] = useState({ right: 0, total: 0 })

  const show = useCallback((next: number, daily: boolean) => {
    setIndex(next)
    setIsDaily(daily)
    setChoices(authorChoices(FEATURED_QUOTES[next].author))
    setGuess(null)
  }, [])

  useEffect(() => {
    // Uses the local date, Math.random and localStorage, so it has to run in
    // the browser after mount rather than during server rendering.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    show(quoteOfTheDayIndex(), true)
    setScore(readJson(SCORE_KEY, { right: 0, total: 0 }))
  }, [show])

  // Match "Gus" to the member whose display name starts with it, for avatars.
  const memberFor = useMemo(() => {
    const map = new Map<Name, Member>()
    for (const name of NAMES) {
      const member = members.find((m) =>
        m.display_name.toLowerCase().startsWith(name.toLowerCase())
      )
      if (member) map.set(name, member)
    }
    return map
  }, [members])

  const quote = index === null ? null : FEATURED_QUOTES[index]
  const answered = guess !== null
  const star = quote ? memberFor.get(quote.name) : undefined

  function handleGuess(author: string) {
    if (!quote || answered) return
    setGuess(author)
    const next = {
      right: score.right + (author === quote.author ? 1 : 0),
      total: score.total + 1,
    }
    setScore(next)
    writeJson(SCORE_KEY, next)
  }

  function pickFilter(name: Name | null) {
    setFilter(name)
    show(randomIndex(name, index), false)
  }

  return (
    <div className="card relative overflow-hidden p-5 sm:p-6">
      <span
        className="pointer-events-none absolute -top-4 right-3 font-serif text-8xl leading-none text-stone-100 select-none"
        aria-hidden="true"
      >
        ”
      </span>
      <div className="relative">
        <div className="flex items-center justify-between gap-2">
          <p className="eyebrow flex items-center gap-2">
            {quote && (
              <Avatar
                name={star?.display_name ?? quote.name}
                url={star?.avatar_url}
                size={6}
                showTooltip={false}
              />
            )}
            {quote
              ? isDaily
                ? `Today’s quote stars ${quote.name}`
                : `Starring ${quote.name}`
              : 'Quote of the day'}
          </p>
          <button
            type="button"
            onClick={() => show(randomIndex(filter, index), false)}
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

            {answered ? (
              <figcaption className="mt-3 text-sm">
                <p
                  className={`font-semibold ${
                    guess === quote.author ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                  role="status"
                >
                  {guess === quote.author
                    ? 'Correct!'
                    : guess === ''
                      ? 'Here’s the answer:'
                      : `Not ${guess}.`}
                </p>
                <p className="mt-0.5 text-stone-600">
                  — {quote.author}, <cite>{quote.source}</cite>
                </p>
              </figcaption>
            ) : (
              <figcaption className="mt-4">
                <p className="text-xs font-semibold text-stone-500">Who wrote it?</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {choices.map((author) => (
                    <button
                      key={author}
                      type="button"
                      onClick={() => handleGuess(author)}
                      className="btn btn-secondary btn-sm whitespace-normal text-left"
                    >
                      {author}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setGuess('')}
                    className="btn btn-ghost btn-sm"
                  >
                    Just tell me
                  </button>
                </div>
              </figcaption>
            )}
          </figure>
        ) : (
          <div className="mt-4 space-y-2.5">
            <div className="h-4 w-full animate-pulse rounded bg-stone-100" />
            <div className="h-4 w-11/12 animate-pulse rounded bg-stone-100" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-stone-100" />
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-stone-100 pt-3">
          <span className="mr-1 text-xs text-stone-400">Quotes about</span>
          {[null, ...NAMES].map((name) => (
            <button
              key={name ?? 'all'}
              type="button"
              aria-pressed={filter === name}
              onClick={() => pickFilter(name)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                filter === name
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {name ?? 'Everyone'}
            </button>
          ))}
        </div>
        {score.total > 0 && (
          <p className="mt-2 text-xs text-stone-400">
            Your guessing record: {score.right} of {score.total} authors right
          </p>
        )}
      </div>
    </div>
  )
}
