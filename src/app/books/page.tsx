import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import BookTable, { type BookRow } from '@/components/BookTable'

export default async function BooksPage() {
  const supabase = await createClient()

  const { data: books } = await supabase
    .from('books')
    .select('*, picker:profiles!picked_by(display_name, avatar_url)')
    .eq('status', 'finished')
    .order('date_finished', { ascending: false, nullsFirst: false })

  const { data: ratingsNotes } = await supabase
    .from('ratings_notes')
    .select('book_id, rating, profile:profiles!user_id(display_name)')

  const averageRatings = new Map<string, number>()
  const ratingBreakdowns = new Map<string, { name: string; rating: number }[]>()
  if (ratingsNotes) {
    const ratingsByBook = new Map<string, number[]>()
    for (const rn of ratingsNotes) {
      if (rn.rating === null) continue
      const arr = ratingsByBook.get(rn.book_id) ?? []
      arr.push(rn.rating)
      ratingsByBook.set(rn.book_id, arr)

      const breakdown = ratingBreakdowns.get(rn.book_id) ?? []
      breakdown.push({
        name: (rn.profile as unknown as { display_name: string } | null)?.display_name ?? 'Unknown',
        rating: rn.rating,
      })
      ratingBreakdowns.set(rn.book_id, breakdown)
    }
    for (const [bookId, ratings] of ratingsByBook) {
      averageRatings.set(bookId, ratings.reduce((sum, r) => sum + r, 0) / ratings.length)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Book History</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/books/new"
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-stone-700 hover:shadow-lg active:scale-95 transition-all"
          >
            Add a book
          </Link>
        </div>
      </div>

      <BookTable
        books={(books as BookRow[] | null) ?? []}
        averageRatings={averageRatings}
        ratingBreakdowns={ratingBreakdowns}
      />
    </div>
  )
}
