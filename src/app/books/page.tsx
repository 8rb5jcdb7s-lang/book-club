import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { refreshAllTitles } from '@/lib/actions/books'
import BookTable, { type BookRow } from '@/components/BookTable'

export default async function BooksPage() {
  const supabase = await createClient()

  const { data: books } = await supabase
    .from('books')
    .select('*, picker:profiles!picked_by(display_name)')
    .eq('status', 'finished')
    .order('date_finished', { ascending: false, nullsFirst: false })

  const { data: queued } = await supabase
    .from('books')
    .select('*, picker:profiles!picked_by(display_name)')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })

  const { data: ratingsNotes } = await supabase
    .from('ratings_notes')
    .select('book_id, rating')

  const averageRatings = new Map<string, number>()
  if (ratingsNotes) {
    const ratingsByBook = new Map<string, number[]>()
    for (const rn of ratingsNotes) {
      if (rn.rating === null) continue
      const arr = ratingsByBook.get(rn.book_id) ?? []
      arr.push(rn.rating)
      ratingsByBook.set(rn.book_id, arr)
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
          <form action={refreshAllTitles}>
            <button
              type="submit"
              className="rounded-lg border-2 border-stone-300 px-4 py-2 text-sm font-bold text-stone-700 shadow-sm hover:bg-stone-100 hover:shadow-md active:scale-95 transition-all"
            >
              Refresh titles
            </button>
          </form>
          <Link
            href="/books/new"
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-stone-700 hover:shadow-lg active:scale-95 transition-all"
          >
            Add a book
          </Link>
        </div>
      </div>

      <BookTable books={(books as BookRow[] | null) ?? []} averageRatings={averageRatings} />

      {queued && queued.length > 0 && (
        <div>
          <h2 className="mb-2 text-lg font-bold text-stone-900">Up Next (Queue)</h2>
          <ul className="space-y-1 text-sm text-stone-700">
            {queued.map((book) => (
              <li key={book.id}>
                <Link href={`/books/${book.id}`} className="hover:underline">
                  {book.title}
                </Link>
                {book.author ? ` — ${book.author}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
