import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/dates'
import { daysTaken, historicalPace } from '@/lib/pace'
import { startReading } from '@/lib/actions/books'
import BookCover from '@/components/BookCover'
import ConfirmActionButton from '@/components/ConfirmActionButton'
import NotesList from '@/components/NotesList'
import PickerSelect from '@/components/PickerSelect'
import QuoteList from '@/components/QuoteList'
import RatingInput from '@/components/RatingInput'
import ScoreBadge from '@/components/ScoreBadge'

export const metadata: Metadata = { title: 'Book' }

const STATUS_LABELS = {
  reading: { label: 'Reading now', className: 'bg-amber-100 text-amber-900' },
  finished: { label: 'Finished', className: 'bg-emerald-100 text-emerald-900' },
  queued: { label: 'Want to read', className: 'bg-stone-200 text-stone-700' },
} as const

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [
    {
      data: { user },
    },
    { data: book },
    { data: ratingsNotes },
    { data: quotes },
    { data: members },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('books')
      .select('*, picker:profiles!picked_by(display_name, avatar_url)')
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('ratings_notes')
      .select('*, profile:profiles!user_id(display_name, avatar_url)')
      .eq('book_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('quotes')
      .select('*, profile:profiles!user_id(display_name)')
      .eq('book_id', id)
      .order('created_at', { ascending: true }),
    supabase.from('profiles').select('id, display_name, avatar_url').order('display_name'),
  ])

  if (!book) notFound()

  const days = daysTaken(book)
  const pace = historicalPace(book)

  const notes = ratingsNotes ?? []
  const myRating = notes.find((rn) => rn.user_id === user?.id) ?? null
  const rated = notes.filter((rn) => rn.rating !== null)
  const dnfCount = notes.filter((rn) => rn.did_not_finish).length
  const averageRating = rated.length
    ? rated.reduce((sum, rn) => sum + (rn.rating ?? 0), 0) / rated.length
    : null

  const status = STATUS_LABELS[book.status as keyof typeof STATUS_LABELS]
  const query = encodeURIComponent(`${book.title} ${book.author ?? ''}`.trim())
  const goodreadsUrl = book.goodreads_id
    ? `https://www.goodreads.com/book/show/${encodeURIComponent(book.goodreads_id)}`
    : `https://www.goodreads.com/search?q=${query}`
  const amazonUrl = book.amazon_asin
    ? `https://www.amazon.com/dp/${encodeURIComponent(book.amazon_asin)}`
    : `https://www.amazon.com/s?k=${query}&i=stripbooks`

  const facts: { label: string; value: React.ReactNode }[] = []
  if (book.page_count) facts.push({ label: 'Pages', value: book.page_count })
  if (book.genre) facts.push({ label: 'Genre', value: book.genre })
  facts.push({
    label: book.status === 'queued' ? 'Suggested by' : 'Picked by',
    value: <PickerSelect bookId={book.id} pickedBy={book.picked_by} members={members ?? []} />,
  })
  if (book.date_started) facts.push({ label: 'Started', value: formatDate(book.date_started) })
  if (book.date_finished) facts.push({ label: 'Finished', value: formatDate(book.date_finished) })
  if (days && pace) {
    facts.push({
      label: 'Read in',
      value: `${days} ${days === 1 ? 'day' : 'days'} · ${pace.toFixed(1)} pg/day`,
    })
  }

  return (
    <div className="space-y-10">
      <div className="card flex flex-col gap-6 p-5 sm:flex-row sm:p-6">
        <BookCover
          coverUrl={book.cover_url}
          title={book.title}
          author={book.author}
          className="mx-auto aspect-[2/3] w-40 shrink-0 sm:mx-0 sm:w-44"
        />
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.className}`}
              >
                {status.label}
              </span>
              <h1 className="mt-2 text-3xl leading-tight font-semibold text-stone-900 sm:text-4xl">
                {book.title}
              </h1>
              {book.author && <p className="mt-1 text-lg text-stone-600">by {book.author}</p>}
            </div>
            {averageRating !== null && (
              <div className="flex flex-col items-center gap-1">
                <ScoreBadge
                  rating={averageRating}
                  size="lg"
                  breakdown={rated.map((rn) => ({
                    name: rn.profile?.display_name ?? 'Unknown',
                    rating: rn.rating as number,
                  }))}
                />
                <span className="text-center text-xs text-stone-500">
                  avg of {rated.length} {rated.length === 1 ? 'rating' : 'ratings'}
                  {dnfCount > 0 && <span className="block">{dnfCount} did not finish</span>}
                </span>
              </div>
            )}
          </div>

          {facts.length > 0 && (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-xs font-medium tracking-wide text-stone-400 uppercase">
                    {fact.label}
                  </dt>
                  <dd className="mt-0.5 font-medium text-stone-800">{fact.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {book.synopsis && (
            <details className="group text-sm text-stone-600" open={book.synopsis.length < 400}>
              <summary className="cursor-pointer font-medium text-stone-700 select-none hover:text-stone-900">
                Synopsis
              </summary>
              <p className="mt-2 max-w-prose leading-relaxed whitespace-pre-line">
                {book.synopsis}
              </p>
            </details>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {book.status === 'queued' && (
              <ConfirmActionButton
                action={startReading.bind(null, book.id)}
                confirmMessage={`Start reading "${book.title}" now? The current book (if any) moves to History and the pick rotation advances.`}
                pendingLabel="Starting…"
                className="btn btn-primary"
              >
                Start reading
              </ConfirmActionButton>
            )}
            <Link href={`/books/${book.id}/edit`} className="btn btn-secondary">
              Edit
            </Link>
            <a href={goodreadsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
              Goodreads ↗
            </a>
            <a href={amazonUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
              Amazon ↗
            </a>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="section-title mb-3">Your rating &amp; notes</h2>
          <RatingInput
            bookId={book.id}
            initialRating={myRating?.rating ?? null}
            initialNotes={myRating?.notes ?? null}
            initialDidNotFinish={Boolean(myRating?.did_not_finish)}
          />
        </section>
        <section>
          <h2 className="section-title mb-3">What everyone thought</h2>
          <NotesList ratingsNotes={notes} />
        </section>
      </div>

      <section>
        <h2 className="section-title mb-3">Favorite quotes</h2>
        <QuoteList bookId={book.id} quotes={quotes ?? []} currentUserId={user?.id ?? ''} />
      </section>
    </div>
  )
}
