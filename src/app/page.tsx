import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import BookCover from '@/components/BookCover'
import NowReadingCard from '@/components/NowReadingCard'
import PickerRotationCard from '@/components/PickerRotationCard'
import QuoteOfTheDayCard from '@/components/QuoteOfTheDayCard'

type Finisher = {
  user_id: string
  finished_at: string
  profile: { display_name: string; avatar_url: string | null }
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { data: book },
    { data: rotation },
    { data: profiles },
    { data: queued },
    {
      data: { user },
    },
  ] = await Promise.all([
    supabase
      .from('books')
      .select('*, picker:profiles!picked_by(display_name, avatar_url)')
      .eq('status', 'reading')
      .maybeSingle(),
    supabase
      .from('picker_rotation')
      .select('member_order, current_index')
      .eq('id', 1)
      .maybeSingle(),
    supabase.from('profiles').select('*').order('display_name'),
    supabase
      .from('books')
      .select('id, title, author, cover_url')
      .eq('status', 'queued')
      .order('created_at', { ascending: false }),
    supabase.auth.getUser(),
  ])

  let finishers: Finisher[] = []
  if (book) {
    const { data } = await supabase
      .from('book_finishes')
      .select('user_id, finished_at, profile:profiles!user_id(display_name, avatar_url)')
      .eq('book_id', book.id)
    finishers = (data as unknown as Finisher[]) ?? []
  }

  const queuedBooks = queued ?? []

  // Nudge: has this member rated the book the club finished most recently?
  let unratedBook: { id: string; title: string } | null = null
  if (user) {
    const { data: lastFinished } = await supabase
      .from('books')
      .select('id, title')
      .eq('status', 'finished')
      .order('date_finished', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle()
    if (lastFinished) {
      const { data: myRating } = await supabase
        .from('ratings_notes')
        .select('*')
        .eq('book_id', lastFinished.id)
        .eq('user_id', user.id)
        .maybeSingle()
      if (!myRating || (myRating.rating === null && !myRating.did_not_finish)) {
        unratedBook = lastFinished
      }
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {unratedBook && (
          <Link
            href={`/books/${unratedBook.id}`}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-2xl border border-amber-200 bg-accent-soft px-5 py-3 text-sm transition-colors hover:border-amber-300"
          >
            <span className="text-amber-950">
              You haven&apos;t rated <span className="font-semibold">{unratedBook.title}</span> yet.
            </span>
            <span className="font-semibold text-accent">Rate it →</span>
          </Link>
        )}
        <NowReadingCard
          book={book}
          finishers={finishers}
          memberCount={profiles?.length ?? 0}
          currentUserId={user?.id ?? null}
          hasQueuedBooks={queuedBooks.length > 0}
        />
        <PickerRotationCard
          memberOrder={rotation?.member_order ?? []}
          currentIndex={rotation?.current_index ?? 0}
          profiles={profiles ?? []}
        />
      </div>

      <div className="space-y-6">
        <QuoteOfTheDayCard />

        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Want to read</p>
            <Link href="/want-to-read" className="btn btn-ghost btn-sm -mr-2">
              {queuedBooks.length > 0 ? `See all ${queuedBooks.length}` : 'Open list'}
            </Link>
          </div>
          {queuedBooks.length === 0 ? (
            <p className="mt-3 text-sm text-stone-500">
              Nothing queued up yet. Add books you&apos;d like the club to read.
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {queuedBooks.slice(0, 4).map((b) => (
                <Link
                  key={b.id}
                  href={`/books/${b.id}`}
                  title={b.title}
                  className="transition-transform hover:-translate-y-0.5"
                >
                  <BookCover
                    coverUrl={b.cover_url}
                    title={b.title}
                    author={b.author}
                    className="aspect-[2/3] w-full"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
