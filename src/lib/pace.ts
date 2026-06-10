import type { Book } from './types'

const MS_PER_DAY = 1000 * 60 * 60 * 24

function daysBetween(start: string, end: string): number {
  const days = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / MS_PER_DAY
  )
  return Math.max(1, days)
}

/** Days taken to read a finished book. Null if dates/page count are missing. */
export function daysTaken(book: Book): number | null {
  if (!book.date_started || !book.date_finished) return null
  return daysBetween(book.date_started, book.date_finished)
}

/** Average pages/day for a finished book. Null if data is missing. */
export function historicalPace(book: Book): number | null {
  const days = daysTaken(book)
  if (days === null || !book.page_count) return null
  return book.page_count / days
}

/** Pages/day required to finish the currently-reading book by its target date. */
export function requiredPace(book: Book, today: Date = new Date()): number | null {
  if (!book.page_count || !book.target_finish_date) return null

  const pagesRemaining = Math.max(0, book.page_count - book.pages_read_so_far)
  const todayStr = today.toISOString().slice(0, 10)
  const daysRemaining = Math.max(
    1,
    Math.round(
      (new Date(book.target_finish_date).getTime() - new Date(todayStr).getTime()) /
        MS_PER_DAY
    )
  )

  return pagesRemaining / daysRemaining
}
