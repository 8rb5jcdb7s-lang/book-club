import type { Metadata } from 'next'
import Link from 'next/link'
import Avatar from '@/components/Avatar'
import BookCover from '@/components/BookCover'
import ConfirmActionButton from '@/components/ConfirmActionButton'
import RandomPick from '@/components/RandomPick'
import VoteButton from '@/components/VoteButton'
import StartReadingButton from '@/components/StartReadingButton'
import WantToReadAddForm from '@/components/WantToReadAddForm'
import { deleteBook } from '@/lib/actions/books'
import { pickQueue } from '@/lib/picks'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Want to Read' }

export default async function WantToReadPage() {
  const supabase = await createClient()

  const [
    { data: queuedBooks },
    { data: profiles },
    { data: pickedBooks },
    { data: votes, error: votesError },
    {
      data: { user },
    },
  ] = await Promise.all([
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
    supabase.from('book_votes').select('book_id, user_id'),
    supabase.auth.getUser(),
  ])

  // Voting needs the book_votes table (a one-time migration). Until it
  // exists the list simply shows without thumbs.
  const votingOn = !votesError
  const votersOf = new Map<string, string[]>()
  for (const vote of votes ?? []) {
    votersOf.set(vote.book_id, [...(votersOf.get(vote.book_id) ?? []), vote.user_id])
  }
  // Most wanted first; the newest suggestion wins a tie.
  const books = [...(queuedBooks ?? [])].sort(
    (a, b) => (votersOf.get(b.id)?.length ?? 0) - (votersOf.get(a.id)?.length ?? 0)
  )

  const members = profiles ?? []
  const nameOf = new Map(members.map((m) => [m.id, m.display_name]))
  // Whoever has waited longest since their last pick is offered as the picker.
  const suggestedPickerId = pickQueue(pickedBooks ?? [], members)[0]?.profile.id ?? null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Want to Read</h1>
        <p className="mt-1 text-sm text-stone-500">
          Ideas for future picks. Anyone can add to the list
          {votingOn ? ', and a thumbs-up moves a book towards the front.' : '.'}
        </p>
      </div>

      <WantToReadAddForm />

      {books.length > 1 && (
        <RandomPick
          books={books.map((book) => ({
            id: book.id,
            title: book.title,
            author: book.author,
            cover_url: book.cover_url,
          }))}
        />
      )}

      {books.length === 0 ? (
        <p className="empty-state">
          The list is empty. Add the first book you&apos;d like the club to read.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {books.map((book) => (
            <li key={book.id} className="flex flex-col">
              <Link
                href={`/books/${book.id}`}
                aria-label={`Open ${book.title}`}
                className="block transition-transform hover:-translate-y-1"
              >
                <BookCover
                  coverUrl={book.cover_url}
                  title={book.title}
                  author={book.author}
                  className="aspect-[2/3] w-full"
                />
              </Link>
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
                  {votingOn && (
                    <VoteButton
                      bookId={book.id}
                      voted={Boolean(user && votersOf.get(book.id)?.includes(user.id))}
                      voterNames={(votersOf.get(book.id) ?? []).map(
                        (id) => nameOf.get(id) ?? 'Someone'
                      )}
                    />
                  )}
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
