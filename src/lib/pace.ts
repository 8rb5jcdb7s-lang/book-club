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

/** Days until the target finish date (0 = due today, negative = overdue). */
export function daysUntilTarget(book: Book, today: string = todayStr()): number | null {
  if (!book.target_finish_date) return null
  return daysBetween(today, book.target_finish_date)
}

/** Pages/day required to finish the currently-reading book by its target date. */
export function requiredPace(book: Book, today: string = todayStr()): number | null {
  if (!book.page_count || !book.target_finish_date) return null

  const pagesRemaining = Math.max(0, book.page_count - book.pages_read_so_far)
  const daysRemaining = Math.max(1, daysBetween(today, book.target_finish_date))

  return pagesRemaining / daysRemaining
}

/** 0–100 progress through the current book, or null without a page count. */
export function progressPercent(book: Book): number | null {
  if (!book.page_count) return null
  return Math.min(100, Math.max(0, Math.round((book.pages_read_so_far / book.page_count) * 100)))
}
