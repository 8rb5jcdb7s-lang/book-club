import { daysBetween, todayStr } from './dates'
import type { Book } from './types'

/** Days taken to read a finished book. Null if dates are missing. */
export function daysTaken(book: Book): number | null {
  if (!book.date_started || !book.date_finished) return null
  return Math.max(1, daysBetween(book.date_started, book.date_finished))
}

/** Average pages/day for a finished book. Null if data is missing. */
export function historicalPace(book: Book): number | null {
  const days = daysTaken(book)
  if (days === null || !book.page_count) return null
  return book.page_count / days
}

export type ReadingSchedule = {
  /** 1 on the day the book was started. Null without a start date. */
  dayNumber: number | null
  /** Length of the reading window in days. Null without a target date. */
  totalDays: number | null
  /** Days until the target (0 = today, negative = overdue). */
  daysLeft: number | null
  /** 0–1 share of the reading window that has passed. */
  fraction: number | null
  /** Pages a day needed to cover the whole book in the window. */
  pagesPerDay: number | null
  /** The page someone reading at an even pace would be on today. */
  onPacePage: number | null
}

/**
 * Where the club "should" be in the current book, worked out purely from the
 * start date, target date and page count — nobody has to log anything.
 */
export function readingSchedule(
  book: Pick<Book, 'date_started' | 'target_finish_date' | 'page_count'>,
  today: string = todayStr()
): ReadingSchedule {
  const elapsed = book.date_started ? Math.max(0, daysBetween(book.date_started, today)) : null
  const dayNumber = elapsed === null ? null : elapsed + 1
  const daysLeft = book.target_finish_date ? daysBetween(today, book.target_finish_date) : null

  if (!book.date_started || !book.target_finish_date || elapsed === null) {
    return { dayNumber, totalDays: null, daysLeft, fraction: null, pagesPerDay: null, onPacePage: null }
  }

  const totalDays = Math.max(1, daysBetween(book.date_started, book.target_finish_date))
  const fraction = Math.min(1, elapsed / totalDays)

  return {
    dayNumber,
    totalDays,
    daysLeft,
    fraction,
    pagesPerDay: book.page_count ? book.page_count / totalDays : null,
    onPacePage: book.page_count ? Math.round(book.page_count * fraction) : null,
  }
}

/** Calendar days from a book's start to a finish timestamp (at least 1). */
export function daysToFinish(dateStarted: string | null, finishedAt: string): number | null {
  if (!dateStarted) return null
  return Math.max(1, daysBetween(dateStarted, todayStr(new Date(finishedAt))))
}
