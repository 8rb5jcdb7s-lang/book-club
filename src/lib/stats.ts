import { daysTaken, historicalPace } from './pace'
import type { Book, Profile, Quote, RatingNote } from './types'

function finished(books: Book[]): Book[] {
  return books.filter((b) => b.status === 'finished' && b.page_count && b.date_started && b.date_finished)
}

export function totalPagesRead(books: Book[]): number {
  return books
    .filter((b) => b.status === 'finished')
    .reduce((sum, b) => sum + (b.page_count ?? 0), 0)
}

export function totalDaysReading(books: Book[]): number {
  return finished(books).reduce((sum, b) => sum + (daysTaken(b) ?? 0), 0)
}

export function averagePace(books: Book[]): number | null {
  const paces = finished(books)
    .map(historicalPace)
    .filter((p): p is number => p !== null)
  if (paces.length === 0) return null
  return paces.reduce((sum, p) => sum + p, 0) / paces.length
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
  const withPace = finished(books)
    .map((book) => ({ book, pace: historicalPace(book) }))
    .filter((x): x is { book: Book; pace: number } => x.pace !== null)

  if (withPace.length === 0) return { fastest: null, slowest: null }

  const sorted = [...withPace].sort((a, b) => b.pace - a.pace)
  return { fastest: sorted[0], slowest: sorted[sorted.length - 1] }
}

export function pickerLeaderboard(
  books: Book[],
  ratingsNotes: RatingNote[],
  profiles: Profile[]
): { profile: Profile; averageRating: number; bookCount: number }[] {
  const ratingsByBook = new Map<string, number[]>()
  for (const rn of ratingsNotes) {
    if (rn.rating === null) continue
    const arr = ratingsByBook.get(rn.book_id) ?? []
    arr.push(rn.rating)
    ratingsByBook.set(rn.book_id, arr)
  }

  const result: { profile: Profile; averageRating: number; bookCount: number }[] = []

  for (const profile of profiles) {
    const pickedBooks = books.filter(
      (b) => b.status === 'finished' && b.picked_by === profile.id
    )
    const allRatings = pickedBooks.flatMap((b) => ratingsByBook.get(b.id) ?? [])
    if (allRatings.length === 0) continue

    result.push({
      profile,
      averageRating: allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length,
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

    result.push({
      profile,
      averageRating: ratings.reduce((sum, r) => sum + r, 0) / ratings.length,
      ratingCount: ratings.length,
    })
  }

  return result.sort((a, b) => b.averageRating - a.averageRating)
}

export function biggestDisagreement(
  books: Book[],
  ratingsNotes: RatingNote[]
): { book: Book; spread: number }[] {
  const ratingsByBook = new Map<string, number[]>()
  for (const rn of ratingsNotes) {
    if (rn.rating === null) continue
    const arr = ratingsByBook.get(rn.book_id) ?? []
    arr.push(rn.rating)
    ratingsByBook.set(rn.book_id, arr)
  }

  const result: { book: Book; spread: number }[] = []
  for (const book of books) {
    const ratings = ratingsByBook.get(book.id)
    if (!ratings || ratings.length < 2) continue
    result.push({ book, spread: Math.max(...ratings) - Math.min(...ratings) })
  }

  return result.sort((a, b) => b.spread - a.spread)
}

export function genreBreakdown(books: Book[]): { genre: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const book of books) {
    if (book.status !== 'finished') continue
    const genre = book.genre || 'Unknown'
    counts.set(genre, (counts.get(genre) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
}

export function readingStreak(books: Book[]): number {
  const sorted = finished(books)
    .filter((b) => b.date_finished)
    .sort((a, b) => new Date(b.date_finished!).getTime() - new Date(a.date_finished!).getTime())
  return sorted.length
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

  return quotes.map((q) => ({
    ...q,
    bookTitle: bookMap.get(q.book_id) ?? 'Unknown book',
    authorName: profileMap.get(q.user_id) ?? 'Unknown',
  }))
}
