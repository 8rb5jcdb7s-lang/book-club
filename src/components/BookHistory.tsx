'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Avatar from '@/components/Avatar'
import BookCover from '@/components/BookCover'
import ScoreBadge from '@/components/ScoreBadge'
import { formatDate } from '@/lib/dates'
import type { Book } from '@/lib/types'

export type HistoryRow = {
  book: Book & { picker?: { display_name: string; avatar_url: string | null } | null }
  days: number | null
  pace: number | null
  averageRating: number | null
  breakdown: { name: string; rating: number }[]
}

const SORTS = {
  recent: 'Recently finished',
  rating: 'Highest rated',
  longest: 'Longest',
  fastest: 'Fastest read',
  title: 'Title (A–Z)',
} as const

type SortKey = keyof typeof SORTS

// Sorts descending by a numeric value, always keeping missing values last.
function byNumberDesc(get: (row: HistoryRow) => number | null) {
  return (a: HistoryRow, b: HistoryRow) => {
    const av = get(a)
    const bv = get(b)
    if (av === null && bv === null) return 0
    if (av === null) return 1
    if (bv === null) return -1
    return bv - av
  }
}

function sortRows(rows: HistoryRow[], sort: SortKey): HistoryRow[] {
  const sorted = [...rows]
  switch (sort) {
    case 'rating':
      return sorted.sort(byNumberDesc((r) => r.averageRating))
    case 'longest':
      return sorted.sort(byNumberDesc((r) => r.book.page_count))
    case 'fastest':
      return sorted.sort(byNumberDesc((r) => r.pace))
    case 'title':
      return sorted.sort((a, b) => a.book.title.localeCompare(b.book.title))
    default:
      return sorted.sort((a, b) =>
        (b.book.date_finished ?? '').localeCompare(a.book.date_finished ?? '')
      )
  }
}

function readRange(book: Book): string {
  if (book.date_started && book.date_finished) {
    const sameYear = book.date_started.slice(0, 4) === book.date_finished.slice(0, 4)
    return `${formatDate(book.date_started, { withYear: !sameYear })} – ${formatDate(book.date_finished)}`
  }
  if (book.date_finished) return `Finished ${formatDate(book.date_finished)}`
  return '—'
}

export default function BookHistory({ rows }: { rows: HistoryRow[] }) {
  const [sort, setSort] = useState<SortKey>('recent')
  const [view, setView] = useState<'list' | 'shelf'>('list')
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? rows.filter(
          (r) =>
            r.book.title.toLowerCase().includes(q) ||
            (r.book.author ?? '').toLowerCase().includes(q) ||
            (r.book.picker?.display_name ?? '').toLowerCase().includes(q)
        )
      : rows
    return sortRows(filtered, sort)
  }, [rows, sort, query])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, author or picker"
          aria-label="Search books"
          className="input max-w-xs"
        />
        <div
          role="group"
          aria-label="View"
          className="ml-auto flex rounded-full bg-stone-200/60 p-1 text-sm font-medium"
        >
          {(['list', 'shelf'] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={view === option}
              onClick={() => setView(option)}
              className={`rounded-full px-3 py-1 capitalize transition-colors ${
                view === option
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-stone-600">
          Sort by
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="input w-auto py-1.5"
          >
            {Object.entries(SORTS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visible.length === 0 ? (
        <p className="empty-state">No books match “{query}”.</p>
      ) : view === 'shelf' ? (
        <ul className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 sm:gap-x-4 md:grid-cols-5 lg:grid-cols-6">
          {visible.map(({ book, averageRating, breakdown }) => (
            <li key={book.id}>
              <Link
                href={`/books/${book.id}`}
                className="group/shelf relative block transition-transform hover:-translate-y-1"
              >
                <BookCover
                  coverUrl={book.cover_url}
                  title={book.title}
                  author={book.author}
                  className="aspect-[2/3] w-full"
                />
                {averageRating !== null && (
                  <span className="absolute top-1.5 right-1.5 rounded-full shadow-md ring-2 ring-white">
                    <ScoreBadge rating={averageRating} size="sm" breakdown={breakdown} />
                  </span>
                )}
                <span className="mt-2 line-clamp-2 font-serif text-sm leading-snug font-semibold text-stone-900 group-hover/shelf:underline">
                  {book.title}
                </span>
                <span className="line-clamp-1 text-xs text-stone-500">
                  {book.date_finished ? formatDate(book.date_finished) : book.author}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <>
          {/* Desktop: table */}
          <div className="card hidden md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-stone-200 text-left text-xs font-semibold tracking-wider text-stone-500 uppercase">
                <tr>
                  <th className="px-5 py-3 font-semibold">Book</th>
                  <th className="px-4 py-3 text-right font-semibold">Pages</th>
                  <th className="px-4 py-3 font-semibold">Read</th>
                  <th className="px-4 py-3 text-right font-semibold">Pace</th>
                  <th className="px-4 py-3 text-center font-semibold">Score</th>
                  <th className="px-5 py-3 font-semibold">Picked by</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {visible.map(({ book, days, pace, averageRating, breakdown }) => (
                  <tr key={book.id} className="transition-colors hover:bg-stone-50/70">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-4">
                        <BookCover
                          coverUrl={book.cover_url}
                          title={book.title}
                          author={book.author}
                          synopsis={book.synopsis}
                          className="h-28 w-[4.67rem] shrink-0"
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/books/${book.id}`}
                            className="font-serif text-base font-semibold text-stone-900 hover:underline"
                          >
                            {book.title}
                          </Link>
                          <p className="text-stone-500">{book.author ?? 'Unknown author'}</p>
                          {book.genre && (
                            <span className="mt-1.5 inline-block rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                              {book.genre}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-stone-600 tabular-nums">
                      {book.page_count ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      <span className="whitespace-nowrap">{readRange(book)}</span>
                      {days !== null && (
                        <span className="block text-xs text-stone-400">
                          {days} {days === 1 ? 'day' : 'days'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap text-stone-600 tabular-nums">
                      {pace !== null ? `${pace.toFixed(1)} pg/day` : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {averageRating !== null ? (
                        <ScoreBadge rating={averageRating} breakdown={breakdown} />
                      ) : (
                        <Link
                          href={`/books/${book.id}`}
                          className="text-xs font-medium text-accent hover:underline"
                        >
                          Rate it
                        </Link>
                      )}
                    </td>
                    <td className="px-5 py-3 text-stone-600">
                      {book.picker ? (
                        <div className="flex items-center gap-2">
                          <Avatar
                            name={book.picker.display_name}
                            url={book.picker.avatar_url}
                            size={6}
                            showTooltip={false}
                          />
                          {book.picker.display_name}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <ul className="space-y-3 md:hidden">
            {visible.map(({ book, days, pace, averageRating, breakdown }) => (
              <li key={book.id} className="card flex gap-4 p-4">
                <BookCover
                  coverUrl={book.cover_url}
                  title={book.title}
                  author={book.author}
                  synopsis={book.synopsis}
                  className="h-28 w-[4.67rem] shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/books/${book.id}`}
                      className="font-serif text-base leading-snug font-semibold text-stone-900 hover:underline"
                    >
                      {book.title}
                    </Link>
                    {averageRating !== null && (
                      <ScoreBadge rating={averageRating} size="sm" breakdown={breakdown} />
                    )}
                  </div>
                  <p className="text-sm text-stone-500">{book.author ?? 'Unknown author'}</p>
                  <p className="mt-2 text-xs text-stone-500">{readRange(book)}</p>
                  <p className="text-xs text-stone-500">
                    {[
                      book.page_count ? `${book.page_count} pages` : null,
                      days !== null ? `${days} days` : null,
                      pace !== null ? `${pace.toFixed(1)} pg/day` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {book.picker && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-stone-500">
                      <Avatar
                        name={book.picker.display_name}
                        url={book.picker.avatar_url}
                        size={5}
                        showTooltip={false}
                      />
                      Picked by {book.picker.display_name}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
