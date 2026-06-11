import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { daysTaken, historicalPace } from '@/lib/pace'
import RatingInput from '@/components/RatingInput'
import NotesList from '@/components/NotesList'
import QuoteList from '@/components/QuoteList'
import BookCoverFlip from '@/components/BookCoverFlip'

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: book }, { data: ratingsNotes }, { data: quotes }] = await Promise.all([
    supabase
      .from('books')
      .select('*, picker:profiles!picked_by(display_name)')
      .eq('id', id)
      .single(),
    supabase
      .from('ratings_notes')
      .select('*, profile:profiles!user_id(display_name)')
      .eq('book_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('quotes')
      .select('*, profile:profiles!user_id(display_name)')
      .eq('book_id', id)
      .order('created_at', { ascending: true }),
  ])

  if (!book) notFound()

  const days = daysTaken(book)
  const pace = historicalPace(book)

  const myRating = ratingsNotes?.find((rn) => rn.user_id === user?.id) ?? null
  const averageRating = ratingsNotes?.length
    ? ratingsNotes
        .filter((rn) => rn.rating !== null)
        .reduce((sum, rn, _i, arr) => sum + (rn.rating ?? 0) / arr.length, 0)
    : null

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row">
        {book.cover_url && (
          <BookCoverFlip
            coverUrl={book.cover_url}
            title={book.title}
            author={book.author}
            synopsis={book.synopsis}
            className="h-44 w-[7.33rem] shrink-0"
          />
        )}
        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-3xl font-bold text-stone-900">{book.title}</h1>
            <Link
              href={`/books/${book.id}/edit`}
              className="shrink-0 rounded-lg border-2 border-stone-300 px-4 py-2 text-sm font-bold text-stone-700 shadow-sm hover:bg-stone-50 hover:shadow-md active:scale-95 transition-all"
            >
              Edit
            </Link>
          </div>
          {book.author && <p className="text-stone-600">by {book.author}</p>}
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 text-sm text-stone-600">
            {book.page_count && <span>{book.page_count} pages</span>}
            {book.genre && <span>{book.genre}</span>}
            {book.picker?.display_name && <span>Picked by {book.picker.display_name}</span>}
            {days && pace && (
              <span>
                Read in {days} days ({pace.toFixed(1)} pg/day)
              </span>
            )}
            {averageRating !== null && (
              <span className="group relative font-medium text-stone-900">
                Avg rating: {averageRating.toFixed(1)}/10
                <div className="pointer-events-none absolute bottom-full left-0 z-10 mb-1 hidden min-w-max flex-col gap-0.5 rounded bg-stone-900 px-2 py-1 text-xs font-normal text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:flex group-hover:opacity-100">
                  {ratingsNotes
                    ?.filter((rn) => rn.rating !== null)
                    .map((rn) => (
                      <span key={rn.id}>
                        {rn.profile?.display_name ?? 'Unknown'}: {rn.rating}/10
                      </span>
                    ))}
                </div>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="mb-2 text-lg font-bold text-stone-900">Your rating & notes</h2>
          <RatingInput
            bookId={book.id}
            initialRating={myRating?.rating ?? null}
            initialNotes={myRating?.notes ?? null}
          />
        </div>
        <div>
          <h2 className="mb-2 text-lg font-bold text-stone-900">Everyone&apos;s thoughts</h2>
          <NotesList ratingsNotes={ratingsNotes ?? []} />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-bold text-stone-900">Favorite quotes</h2>
        <QuoteList bookId={book.id} quotes={quotes ?? []} currentUserId={user?.id ?? ''} />
      </div>
    </div>
  )
}
