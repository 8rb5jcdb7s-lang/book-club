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
  /** The signed-in member hasn't rated this book (or marked it "did not finish"). */
  needsMyRating: boolean
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

// The line under each title shows whatever the shelf is currently sorted by.
function detailFor(row: HistoryRow, sort: SortKey): string {
  const { book, pace } = row
  if (sort === 'longest' && book.page_count) return `${book.page_count.toLocaleString()} pages`
  if (sort === 'fastest' && pace !== null) return `${pace.toFixed(1)} pages a day`
  if (sort === 'title' && book.author) return book.author
  return book.date_finished ? formatDate(book.date_finished) : (book.author ?? '')
}

/** The club's finished books as a shelf of covers; details live on each book's page. */
export default function BookHistory({ rows }: { rows: HistoryRow[] }) {
  const [sort, setSort] = useState<SortKey>('recent')
  const [query, setQuery] = useState('')
  const [onlyUnrated, setOnlyUnrated] = useState(false)
  const unratedCount = rows.filter((r) => r.needsMyRating).length
  // Once the last one is rated the filter has nothing left to show.
  const showUnrated = onlyUnrated && unratedCount > 0

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const pool = showUnrated ? rows.filter((r) => r.needsMyRating) : rows
    const filtered = q
      ? pool.filter(
          (r) =>
            r.book.title.toLowerCase().includes(q) ||
            (r.book.author ?? '').toLowerCase().includes(q) ||
            (r.book.picker?.display_name ?? '').toLowerCase().includes(q)
        )
      : pool
    return sortRows(filtered, sort)
  }, [rows, sort, query, showUnrated])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, author or picker"
          aria-label="Search books"
          className="input max-w-xs"
        />
        {unratedCount > 0 && (
          <button
            type="button"
            aria-pressed={showUnrated}
            onClick={() => setOnlyUnrated(!showUnrated)}
            className={`btn btn-sm ${showUnrated ? 'bg-sun hover:bg-amber-400' : 'btn-secondary'}`}
          >
            {showUnrated ? 'Show all books' : `You haven’t rated ${unratedCount}`}
          </button>
        )}
        <label className="ml-auto flex items-center gap-2 text-sm text-stone-600">
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
        <p className="empty-state">
          {query.trim() ? `No books match “${query}”.` : 'Nothing here.'}
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-x-3 gap-y-7 sm:grid-cols-4 sm:gap-x-5 md:grid-cols-5 lg:grid-cols-6">
          {visible.map((row) => {
            const { book, averageRating, breakdown, needsMyRating } = row
            return (
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
                    <span className="absolute -top-2.5 -right-2 rounded-full">
                      <ScoreBadge rating={averageRating} size="sm" breakdown={breakdown} />
                    </span>
                  )}
                  {needsMyRating && (
                    <span
                      title="You haven't rated this one yet"
                      className="chip absolute -right-2 -bottom-2.5 bg-sun px-2 text-[10px] shadow-[0_2px_0_0_var(--color-ink)]"
                    >
                      Rate it
                    </span>
                  )}
                  {book.picker && (
                    <span className="absolute -bottom-2.5 -left-2">
                      <Avatar
                        name={book.picker.display_name}
                        url={book.picker.avatar_url}
                        size={8}
                        sticker
                        tooltip={`Picked by ${book.picker.display_name}`}
                      />
                    </span>
                  )}
                </Link>
                <Link href={`/books/${book.id}`} className="mt-4 block hover:underline">
                  <span className="line-clamp-2 font-serif text-sm leading-snug font-semibold text-stone-900">
                    {book.title}
                  </span>
                </Link>
                <span className="line-clamp-1 text-xs text-stone-500">{detailFor(row, sort)}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
