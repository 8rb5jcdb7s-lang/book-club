import type { Metadata } from 'next'
import Link from 'next/link'
import Avatar from '@/components/Avatar'
import BookCover from '@/components/BookCover'
import ConfirmActionButton from '@/components/ConfirmActionButton'
import RandomPick from '@/components/RandomPick'
import StartReadingButton from '@/components/StartReadingButton'
import WantToReadAddForm from '@/components/WantToReadAddForm'
import { deleteBook } from '@/lib/actions/books'
import { pickQueue } from '@/lib/picks'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Want to Read' }

export default async function WantToReadPage() {
  const supabase = await createClient()

  const [{ data: books }, { data: profiles }, { data: pickedBooks }] = await Promise.all([
    supabase
      .from('books')
      .select('*, picker:profiles!picked_by(display_name, avatar_url)')
      .eq('status', 'queued')
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').order('display_name'),
    supabase
      .from('books')
      .select('id, title, status, picked_by, date_started, date_finished, created_at')
      .in('status', ['reading', 'finished']),
  ])

  const members = profiles ?? []
  // Whoever has waited longest since their last pick is offered as the picker.
  const suggestedPickerId = pickQueue(pickedBooks ?? [], members)[0]?.profile.id ?? null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Want to Read</h1>
        <p className="mt-1 text-sm text-stone-500">
          Ideas for future picks. Anyone can add to the list.
        </p>
      </div>

      <WantToReadAddForm />

      {books && books.length > 1 && (
        <RandomPick
          books={books.map((book) => ({
            id: book.id,
            title: book.title,
            author: book.author,
            cover_url: book.cover_url,
          }))}
        />
      )}

      {!books || books.length === 0 ? (
        <p className="empty-state">
          The list is empty. Add the first book you&apos;d like the club to read.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {books.map((book) => (
            <li key={book.id} className="flex flex-col">
              <BookCover
                coverUrl={book.cover_url}
                title={book.title}
                author={book.author}
                className="aspect-[2/3] w-full"
              />
              <div className="mt-3 flex flex-1 flex-col">
                <Link
                  href={`/books/${book.id}`}
                  className="line-clamp-2 font-serif leading-snug font-semibold text-stone-900 hover:underline"
                >
                  {book.title}
                </Link>
                {book.author && (
                  <p className="line-clamp-1 text-sm text-stone-500">{book.author}</p>
                )}
                {book.picker && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-stone-500">
                    <Avatar
                      name={book.picker.display_name}
                      url={book.picker.avatar_url}
                      size={5}
                      showTooltip={false}
                    />
                    Suggested by {book.picker.display_name}
                  </p>
                )}
                <div className="mt-auto flex flex-wrap items-center gap-1 pt-3">
<StartReadingButton
                    bookId={book.id}
                    members={members}
                    suggestedPickerId={suggestedPickerId}
                  />
                  <ConfirmActionButton
                    action={deleteBook.bind(null, book.id, undefined)}
                    confirmMessage={`Remove "${book.title}" from the list?`}
                    pendingLabel="Removing…"
                    className="btn btn-ghost btn-sm hover:text-red-700"
                  >
                    Remove
                  </ConfirmActionButton>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
