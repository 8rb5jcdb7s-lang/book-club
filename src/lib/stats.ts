import { daysBetween, yearOf } from './dates'
import { daysTaken, daysToFinish, historicalPace } from './pace'
import { WORDS_PER_PAGE } from './wordCount'
import type { Book, BookFinish, Profile, Quote, RatingNote } from './types'

/** Finished books with enough data to compute a reading pace. */
function finishedWithPace(books: Book[]): Book[] {
  return books.filter(
    (b) => b.status === 'finished' && b.page_count && b.date_started && b.date_finished
  )
}

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

function ratingsByBook(ratingsNotes: RatingNote[]): Map<string, number[]> {
  const map = new Map<string, number[]>()
  for (const rn of ratingsNotes) {
    if (rn.rating === null) continue
    const arr = map.get(rn.book_id) ?? []
    arr.push(rn.rating)
    map.set(rn.book_id, arr)
  }
  return map
}

export function booksFinished(books: Book[]): number {
  return books.filter((b) => b.status === 'finished').length
}

export function totalPagesRead(books: Book[]): number {
  return books
    .filter((b) => b.status === 'finished')
    .reduce((sum, b) => sum + (b.page_count ?? 0), 0)
}

export function totalDaysReading(books: Book[]): number {
  return finishedWithPace(books).reduce((sum, b) => sum + (daysTaken(b) ?? 0), 0)
}

export function totalWordsInYear(books: Book[], year: number): number {
  let pages = 0

  for (const book of books) {
    if (book.status === 'finished' && book.date_finished) {
      if (yearOf(book.date_finished) === year) pages += book.page_count ?? 0
    }
  }

  return pages * WORDS_PER_PAGE
}

export function averagePace(books: Book[]): number | null {
  const paces = finishedWithPace(books)
    .map(historicalPace)
    .filter((p): p is number => p !== null)
  return paces.length === 0 ? null : average(paces)
}

export function averageRatingOverall(ratingsNotes: RatingNote[]): number | null {
  const ratings = ratingsNotes.filter((rn) => rn.rating !== null).map((rn) => rn.rating as number)
  return ratings.length === 0 ? null : average(ratings)
}

export function longestShortestBooks(books: Book[]): {
  longest: Book | null
  shortest: Book | null
} {
  const withPages = books.filter((b) => b.status === 'finished' && b.page_count)
  if (withPages.length === 0) return { longest: null, shortest: null }
  const sorted = [...withPages].sort((a, b) => (b.page_count ?? 0) - (a.page_count ?? 0))
  return { longest: sorted[0], shortest: sorted[sorted.length - 1] }
}

export function fastestSlowestReads(books: Book[]): {
  fastest: { book: Book; pace: number } | null
  slowest: { book: Book; pace: number } | null
} {
  const withPace = finishedWithPace(books)
    .map((book) => ({ book, pace: historicalPace(book) }))
    .filter((x): x is { book: Book; pace: number } => x.pace !== null)

  if (withPace.length === 0) return { fastest: null, slowest: null }

  const sorted = [...withPace].sort((a, b) => b.pace - a.pace)
  return { fastest: sorted[0], slowest: sorted[sorted.length - 1] }
}

export function bestWorstRated(
  books: Book[],
  ratingsNotes: RatingNote[]
): {
  best: { book: Book; rating: number } | null
  worst: { book: Book; rating: number } | null
} {
  const byBook = ratingsByBook(ratingsNotes)
  const rated = books
    .filter((b) => byBook.has(b.id))
    .map((book) => ({ book, rating: average(byBook.get(book.id)!) }))
    .sort((a, b) => b.rating - a.rating)

  if (rated.length === 0) return { best: null, worst: null }
  return { best: rated[0], worst: rated[rated.length - 1] }
}

export function pickerLeaderboard(
  books: Book[],
  ratingsNotes: RatingNote[],
  profiles: Profile[]
): { profile: Profile; averageRating: number; bookCount: number }[] {
  const byBook = ratingsByBook(ratingsNotes)
  const result: { profile: Profile; averageRating: number; bookCount: number }[] = []

  for (const profile of profiles) {
    const pickedBooks = books.filter(
      (b) => b.status === 'finished' && b.picked_by === profile.id
    )
    const allRatings = pickedBooks.flatMap((b) => byBook.get(b.id) ?? [])
    if (allRatings.length === 0) continue

    result.push({
      profile,
      averageRating: average(allRatings),
      bookCount: pickedBooks.length,
    })
  }

  return result.sort((a, b) => b.averageRating - a.averageRating)
}

export function raterStats(
  ratingsNotes: RatingNote[],
  profiles: Profile[]
): { profile: Profile; averageRating: number; ratingCount: number }[] {
  const result: { profile: Profile; averageRating: number; ratingCount: number }[] = []

  for (const profile of profiles) {
    const ratings = ratingsNotes
      .filter((rn) => rn.user_id === profile.id && rn.rating !== null)
      .map((rn) => rn.rating as number)
    if (ratings.length === 0) continue

    result.push({ profile, averageRating: average(ratings), ratingCount: ratings.length })
  }

  return result.sort((a, b) => b.averageRating - a.averageRating)
}

export function biggestDisagreement(
  books: Book[],
  ratingsNotes: RatingNote[]
): { book: Book; spread: number; min: number; max: number }[] {
  const byBook = ratingsByBook(ratingsNotes)

  const result: { book: Book; spread: number; min: number; max: number }[] = []
  for (const book of books) {
    const ratings = byBook.get(book.id)
    if (!ratings || ratings.length < 2) continue
    const min = Math.min(...ratings)
    const max = Math.max(...ratings)
    if (max - min === 0) continue
    result.push({ book, spread: max - min, min, max })
  }

  return result.sort((a, b) => b.spread - a.spread)
}

export function genreBreakdown(books: Book[]): { genre: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const book of books) {
    if (book.status !== 'finished') continue
    const genre = book.genre || 'Uncategorized'
    counts.set(genre, (counts.get(genre) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
}

export type QuoteWallEntry = Quote & {
  bookTitle: string
  authorName: string
}

export function quoteWall(
  quotes: Quote[],
  books: Book[],
  profiles: Profile[]
): QuoteWallEntry[] {
  const bookMap = new Map(books.map((b) => [b.id, b.title]))
  const profileMap = new Map(profiles.map((p) => [p.id, p.display_name]))

  return [...quotes]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((q) => ({
      ...q,
      bookTitle: bookMap.get(q.book_id) ?? 'Unknown book',
      authorName: profileMap.get(q.user_id) ?? 'Unknown',
    }))
}

// ---------------------------------------------------------------------------
// Recap helpers
// ---------------------------------------------------------------------------

/** Years in which the club finished at least one book, newest first. */
export function availableYears(books: Book[]): number[] {
  const years = new Set<number>()
  for (const b of books) {
    if (b.status === 'finished' && b.date_finished) years.add(yearOf(b.date_finished))
  }
  return [...years].sort((a, b) => b - a)
}

/** Finished books in reading order (oldest first); undated ones go first. */
export function finishedInOrder(books: Book[]): Book[] {
  return books
    .filter((b) => b.status === 'finished')
    .sort((a, b) => (a.date_finished ?? '').localeCompare(b.date_finished ?? ''))
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export type MonthBucket = { key: string; label: string; pages: number; titles: string[] }

/**
 * Pages finished per month. With a year: all 12 months of it. Without: every
 * month from the first finished book to the last.
 */
export function pagesByMonth(books: Book[], year: number | null): MonthBucket[] {
  const dated = books.filter((b) => b.status === 'finished' && b.date_finished)
  if (dated.length === 0) return []

  const keys = dated.map((b) => b.date_finished!.slice(0, 7)).sort()
  let [y, m] = year ? [year, 1] : keys[0].split('-').map(Number)
  const [endY, endM] = year ? [year, 12] : keys[keys.length - 1].split('-').map(Number)

  const buckets: MonthBucket[] = []
  while (y < endY || (y === endY && m <= endM)) {
    const key = `${y}-${String(m).padStart(2, '0')}`
    const inMonth = dated.filter((b) => b.date_finished!.slice(0, 7) === key)
    buckets.push({
      key,
      label: year ? MONTHS[m - 1] : `${MONTHS[m - 1]} ’${String(y).slice(2)}`,
      pages: inMonth.reduce((sum, b) => sum + (b.page_count ?? 0), 0),
      titles: inMonth.map((b) => b.title),
    })
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
  }
  return buckets
}

/** How many times each score from 1 to 10 has been given. */
export function ratingDistribution(ratingsNotes: RatingNote[]): number[] {
  const counts = Array<number>(10).fill(0)
  for (const rn of ratingsNotes) {
    // Half points are counted with the whole number below them (7.5 -> 7).
    if (rn.rating !== null && rn.rating >= 1 && rn.rating <= 10) {
      counts[Math.floor(rn.rating) - 1] += 1
    }
  }
  return counts
}

export type MemberSummary = {
  profile: Profile
  ratingCount: number
  averageGiven: number | null
  pickCount: number
  averagePickRating: number | null
  favorite: { book: Book; rating: number } | null
  leastFavorite: { book: Book; rating: number } | null
  quoteCount: number
  dnfCount: number
}

export function memberSummaries(
  books: Book[],
  ratingsNotes: RatingNote[],
  quotes: Quote[],
  profiles: Profile[]
): MemberSummary[] {
  const bookMap = new Map(books.map((b) => [b.id, b]))
  const byBook = ratingsByBook(ratingsNotes)

  return profiles
    .map((profile) => {
      const mine = ratingsNotes
        .filter((rn) => rn.user_id === profile.id && rn.rating !== null && bookMap.has(rn.book_id))
        .map((rn) => ({ book: bookMap.get(rn.book_id)!, rating: rn.rating as number }))
        .sort((a, b) => b.rating - a.rating)
      const picks = books.filter((b) => b.status === 'finished' && b.picked_by === profile.id)
      const pickRatings = picks.flatMap((b) => byBook.get(b.id) ?? [])

      return {
        profile,
        ratingCount: mine.length,
        averageGiven: mine.length ? average(mine.map((x) => x.rating)) : null,
        pickCount: picks.length,
        averagePickRating: pickRatings.length ? average(pickRatings) : null,
        favorite: mine[0] ?? null,
        // Only meaningful when it's a different book from the favorite.
        leastFavorite: mine.length > 1 ? mine[mine.length - 1] : null,
        quoteCount: quotes.filter((q) => q.user_id === profile.id && bookMap.has(q.book_id)).length,
        dnfCount: ratingsNotes.filter(
          (rn) => rn.user_id === profile.id && rn.did_not_finish && bookMap.has(rn.book_id)
        ).length,
      }
    })
    .sort((a, b) => a.profile.display_name.localeCompare(b.profile.display_name))
}

export type TastePair = { a: Profile; b: Profile; averageGap: number; sharedBooks: number }

/**
 * Compares every pair of members on the books they both rated. Returns the
 * pair whose scores sit closest together and the pair furthest apart.
 */
export function tasteMatches(
  ratingsNotes: RatingNote[],
  profiles: Profile[]
): { closest: TastePair | null; furthest: TastePair | null } {
  const byUser = new Map<string, Map<string, number>>()
  for (const rn of ratingsNotes) {
    if (rn.rating === null) continue
    const map = byUser.get(rn.user_id) ?? new Map<string, number>()
    map.set(rn.book_id, rn.rating)
    byUser.set(rn.user_id, map)
  }

  const pairs: TastePair[] = []
  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      const a = byUser.get(profiles[i].id)
      const b = byUser.get(profiles[j].id)
      if (!a || !b) continue
      const gaps: number[] = []
      for (const [bookId, rating] of a) {
        const other = b.get(bookId)
        if (other !== undefined) gaps.push(Math.abs(rating - other))
      }
      if (gaps.length < 2) continue
      pairs.push({
        a: profiles[i],
        b: profiles[j],
        averageGap: average(gaps),
        sharedBooks: gaps.length,
      })
    }
  }

  if (pairs.length === 0) return { closest: null, furthest: null }
  const sorted = [...pairs].sort((x, y) => x.averageGap - y.averageGap)
  return {
    closest: sorted[0],
    furthest: sorted.length > 1 ? sorted[sorted.length - 1] : null,
  }
}

export function distinctAuthors(books: Book[]): number {
  return new Set(
    books
      .filter((b) => b.status === 'finished' && b.author)
      .map((b) => b.author!.trim().toLowerCase())
  ).size
}

/** Longest stretch (in days) between finishing one book and finishing the next. */
export function longestGapDays(books: Book[]): number | null {
  const dates = books
    .filter((b) => b.status === 'finished' && b.date_finished)
    .map((b) => b.date_finished!)
    .sort()
  if (dates.length < 2) return null
  let longest = 0
  for (let i = 1; i < dates.length; i++) {
    longest = Math.max(longest, daysBetween(dates[i - 1], dates[i]))
  }
  return longest
}

/** The book the most members gave up on (null if nobody has). */
export function mostAbandoned(
  books: Book[],
  ratingsNotes: RatingNote[]
): { book: Book; count: number } | null {
  const counts = new Map<string, number>()
  for (const rn of ratingsNotes) {
    if (rn.did_not_finish) counts.set(rn.book_id, (counts.get(rn.book_id) ?? 0) + 1)
  }
  let best: { book: Book; count: number } | null = null
  for (const book of books) {
    const count = counts.get(book.id) ?? 0
    if (count > 0 && (!best || count > best.count)) best = { book, count }
  }
  return best
}

export type FinishSummary = {
  profile: Profile
  /** Books this member marked as finished. */
  finishCount: number
  /** Times they were first / last across the line (books with 2+ finishers). */
  firsts: number
  lasts: number
  averageDays: number | null
  fastest: { book: Book; days: number } | null
}

/**
 * Race stats from the "I finished it!" button: who tends to finish first,
 * who brings up the rear, and how long each person usually takes.
 */
export function finishSummaries(
  books: Book[],
  finishes: BookFinish[],
  profiles: Profile[]
): FinishSummary[] {
  const bookMap = new Map(books.map((b) => [b.id, b]))
  const byBook = new Map<string, BookFinish[]>()
  for (const finish of finishes) {
    if (!bookMap.has(finish.book_id)) continue
    const list = byBook.get(finish.book_id) ?? []
    list.push(finish)
    byBook.set(finish.book_id, list)
  }

  const firsts = new Map<string, number>()
  const lasts = new Map<string, number>()
  for (const list of byBook.values()) {
    if (list.length < 2) continue
    const ordered = [...list].sort((a, b) => a.finished_at.localeCompare(b.finished_at))
    const first = ordered[0].user_id
    const last = ordered[ordered.length - 1].user_id
    firsts.set(first, (firsts.get(first) ?? 0) + 1)
    lasts.set(last, (lasts.get(last) ?? 0) + 1)
  }

  return profiles
    .map((profile) => {
      const mine = finishes
        .filter((f) => f.user_id === profile.id && bookMap.has(f.book_id))
        .map((f) => {
          const book = bookMap.get(f.book_id)!
          return { book, days: daysToFinish(book.date_started, f.finished_at) }
        })
      const timed = mine.filter((x): x is { book: Book; days: number } => x.days !== null)
      const fastest = [...timed].sort((a, b) => a.days - b.days)[0] ?? null

      return {
        profile,
        finishCount: mine.length,
        firsts: firsts.get(profile.id) ?? 0,
        lasts: lasts.get(profile.id) ?? 0,
        averageDays: timed.length ? average(timed.map((x) => x.days)) : null,
        fastest,
      }
    })
    .filter((summary) => summary.finishCount > 0)
    .sort(
      (a, b) =>
        b.firsts - a.firsts ||
        (a.averageDays ?? Infinity) - (b.averageDays ?? Infinity) ||
        a.profile.display_name.localeCompare(b.profile.display_name)
    )
}

/**
 * The highest-rated finished books, best first. Ties go to the book with more
 * ratings, then to the one finished most recently.
 */
export function topRated<T extends Pick<Book, 'id' | 'status' | 'date_finished'>>(
  books: T[],
  ratingsNotes: Pick<RatingNote, 'book_id' | 'rating'>[],
  limit = 3
): { book: T; average: number; ratingCount: number }[] {
  const byBook = new Map<string, number[]>()
  for (const rn of ratingsNotes) {
    if (rn.rating === null) continue
    const list = byBook.get(rn.book_id) ?? []
    list.push(rn.rating)
    byBook.set(rn.book_id, list)
  }

  return books
    .filter((b) => b.status === 'finished' && byBook.has(b.id))
    .map((book) => {
      const ratings = byBook.get(book.id)!
      return { book, average: average(ratings), ratingCount: ratings.length }
    })
    .sort(
      (a, b) =>
        b.average - a.average ||
        b.ratingCount - a.ratingCount ||
        (b.book.date_finished ?? '').localeCompare(a.book.date_finished ?? '')
    )
    .slice(0, limit)
}
