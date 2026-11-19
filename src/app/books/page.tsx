import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import BookHistory, { type HistoryRow } from '@/components/BookHistory'
import { daysTaken, historicalPace } from '@/lib/pace'

export const metadata: Metadata = { title: 'History' }

export default async function BooksPage() {
  const supabase = await createClient()

  const [{ data: books }, { data: ratingsNotes }] = await Promise.all([
    supabase
      .from('books')
      .select('*, picker:profiles!picked_by(display_name, avatar_url)')
      .eq('status', 'finished')
      .order('date_finished', { ascending: false, nullsFirst: false }),
    supabase
      .from('ratings_notes')
      .select('*, profile:profiles!user_id(display_name)'),
  ])

  const breakdowns = new Map<string, { name: string; rating: number }[]>()
  for (const rn of ratingsNotes ?? []) {
    if (rn.rating === null) continue
    const breakdown = breakdowns.get(rn.book_id) ?? []
    breakdown.push({
      name: (rn.profile as unknown as { display_name: string } | null)?.display_name ?? 'Unknown',
      rating: rn.rating,
    })
    breakdowns.set(rn.book_id, breakdown)
  }

  const rows: HistoryRow[] = ((books as HistoryRow['book'][] | null) ?? []).map((book) => {
    const breakdown = breakdowns.get(book.id) ?? []
    return {
      book,
      days: daysTaken(book),
      pace: historicalPace(book),
      averageRating: breakdown.length
        ? breakdown.reduce((sum, r) => sum + r.rating, 0) / breakdown.length
        : null,
      breakdown,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">History</h1>
          <p className="mt-1 text-sm text-stone-500">
            {rows.length === 0
              ? 'Every book the club finishes ends up here.'
              : `${rows.length} ${rows.length === 1 ? 'book' : 'books'} finished so far.`}
          </p>
        </div>
        <Link href="/books/new?status=finished" className="btn btn-primary">
          Add a book
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="empty-state">
          <p>No finished books yet.</p>
          <p className="mt-1">
            Wrap up the current book from the home page, or{' '}
            <Link href="/books/new?status=finished" className="font-medium text-accent underline">
              add one you&apos;ve already read
            </Link>
            .
          </p>
        </div>
      ) : (
        <BookHistory rows={rows} />
      )}
    </div>
  )
}
