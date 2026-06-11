import Link from 'next/link'
import { requiredPace } from '@/lib/pace'
import PagesReadForm from '@/components/PagesReadForm'
import DeleteBookButton from '@/components/DeleteBookButton'
import Avatar from '@/components/Avatar'
import FinishButton from '@/components/FinishButton'
import BookCoverFlip from '@/components/BookCoverFlip'
import type { Book } from '@/lib/types'

type Finisher = {
  user_id: string
  finished_at: string
  profile: { display_name: string; avatar_url: string | null }
}

type Props = {
  book: (Book & { picker?: { display_name: string } | null }) | null
  finishers?: Finisher[]
  currentUserId?: string | null
}

export default function NowReadingCard({ book, finishers = [], currentUserId = null }: Props) {
  if (!book) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm text-center">
        <p className="text-stone-600">No book is currently being read.</p>
        <Link
          href="/books/new"
          className="mt-3 inline-block rounded-lg bg-stone-900 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-stone-700 hover:shadow-lg active:scale-95 transition-all"
        >
          Set the next book
        </Link>
      </div>
    )
  }

  const pace = requiredPace(book)
  const pagesRemaining = book.page_count
    ? Math.max(0, book.page_count - book.pages_read_so_far)
    : null

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm sm:flex-row">
      {book.cover_url && (
        <BookCoverFlip
          coverUrl={book.cover_url}
          title={book.title}
          author={book.author}
          synopsis={book.synopsis}
          className="h-52 w-[8.67rem] shrink-0"
        />
      )}
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Now reading
          </p>
          <DeleteBookButton bookId={book.id} />
        </div>
        <Link href={`/books/${book.id}`} className="block">
          <h2 className="text-2xl font-bold text-stone-900 hover:underline">
            {book.title}
          </h2>
        </Link>
        {book.author && <p className="text-stone-600">by {book.author}</p>}

        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-sm text-stone-600">
          {book.page_count && <span>{book.page_count} pages total</span>}
          {pagesRemaining !== null && <span>{pagesRemaining} pages remaining</span>}
          {book.target_finish_date && <span>Target: {book.target_finish_date}</span>}
          {book.picker?.display_name && <span>Picked by {book.picker.display_name}</span>}
        </div>

        {pace !== null && (
          <p className="rounded-md bg-stone-100 px-3 py-2 text-sm font-medium text-stone-900">
            Read about {Math.ceil(pace)} pages/day to finish on time
          </p>
        )}

        <PagesReadForm
          bookId={book.id}
          pagesReadSoFar={book.pages_read_so_far}
          pageCount={book.page_count}
        />

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {currentUserId && (
            <FinishButton
              bookId={book.id}
              isFinished={finishers.some((f) => f.user_id === currentUserId)}
            />
          )}
          {finishers.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-stone-500">Ready to discuss:</span>
              <div className="flex -space-x-2">
                {finishers.map((f) => (
                  <Avatar
                    key={f.user_id}
                    name={f.profile.display_name}
                    url={f.profile.avatar_url}
                    size={6}
                    tooltip={`${f.profile.display_name} — finished ${new Date(
                      f.finished_at
                    ).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
