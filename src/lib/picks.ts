import { daysBetween, todayStr } from './dates'
import type { Book, Profile } from './types'

export type PickBook = Pick<
  Book,
  'id' | 'title' | 'status' | 'picked_by' | 'date_started' | 'date_finished' | 'created_at'
>

export type PickStatus = {
  profile: Profile
  /** The most recent book this member picked, if any. */
  lastBook: PickBook | null
  lastDate: string | null
  daysSince: number | null
  pickCount: number
}

/** When a book counts as having been picked: its start date, where known. */
export function pickDate(book: PickBook): string {
  return (book.date_started ?? book.date_finished ?? book.created_at).slice(0, 10)
}

/**
 * Who is due to pick next, worked out from the books themselves rather than a
 * fixed rotation: whoever has gone longest since their last pick comes first,
 * and members who have never picked come before everyone.
 *
 * Only books the club is reading or has finished count as picks (not the
 * want-to-read list).
 */
export function pickQueue(
  books: PickBook[],
  profiles: Profile[],
  today: string = todayStr()
): PickStatus[] {
  const picks = books.filter((b) => b.picked_by && b.status !== 'queued')

  return profiles
    .map((profile) => {
      const mine = picks
        .filter((b) => b.picked_by === profile.id)
        .sort((a, b) => pickDate(b).localeCompare(pickDate(a)))
      const lastBook = mine[0] ?? null
      const lastDate = lastBook ? pickDate(lastBook) : null
      return {
        profile,
        lastBook,
        lastDate,
        daysSince: lastDate ? Math.max(0, daysBetween(lastDate, today)) : null,
        pickCount: mine.length,
      }
    })
    .sort((a, b) => {
      if (a.daysSince === null && b.daysSince === null) {
        return a.profile.display_name.localeCompare(b.profile.display_name)
      }
      if (a.daysSince === null) return -1
      if (b.daysSince === null) return 1
      return b.daysSince - a.daysSince
    })
}

/** "today", "3 days ago", "5 weeks ago", "4 months ago". */
export function describeDaysAgo(days: number): string {
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 21) return `${days} days ago`
  if (days < 70) return `${Math.round(days / 7)} weeks ago`
  if (days < 365) return `${Math.round(days / 30.4)} months ago`
  const years = days / 365
  return years < 1.5 ? 'a year ago' : `${years.toFixed(1)} years ago`
}

/** The club's most recent picks, newest first, including any with no picker set. */
export function recentPicks(books: PickBook[], limit = 6): PickBook[] {
  return books
    .filter((b) => b.status !== 'queued')
    .sort((a, b) => pickDate(b).localeCompare(pickDate(a)))
    .slice(0, limit)
}
