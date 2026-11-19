import Link from 'next/link'
import { formatDate } from '@/lib/dates'
import { daysUntilTarget, progressPercent, requiredPace } from '@/lib/pace'
import { finishBook } from '@/lib/actions/books'
import PagesReadForm from '@/components/PagesReadForm'
import Avatar from '@/components/Avatar'
import FinishButton from '@/components/FinishButton'
import BookCover from '@/components/BookCover'
import ConfirmActionButton from '@/components/ConfirmActionButton'
import type { Book } from '@/lib/types'

type Finisher = {
  user_id: string
  finished_at: string
  profile: { display_name: string; avatar_url: string | null }
}

type Props = {
  book: (Book & { picker?: { display_name: string; avatar_url: string | null } | null }) | null
  finishers?: Finisher[]
  memberCount?: number
  currentUserId?: string | null
  hasQueuedBooks?: boolean
}

function paceMessage(book: Book): { text: string; tone: 'neutral' | 'warn' | 'good' } | null {
  const daysLeft = daysUntilTarget(book)
  const pace = requiredPace(book)
  if (daysLeft === null || pace === null || !book.page_count) return null

  if (book.pages_read_so_far >= book.page_count) {
    return { text: 'All pages read — time to talk about it.', tone: 'good' }
  }
  const target = formatDate(book.target_finish_date, { withYear: false })
  if (daysLeft < 0) {
    const days = Math.abs(daysLeft)
    return {
      text: `The ${target} target passed ${days} ${days === 1 ? 'day' : 'days'} ago.`,
      tone: 'warn',
    }
  }
  if (daysLeft === 0) {
    return { text: `Target is today — ${Math.ceil(pace)} pages to go.`, tone: 'warn' }
  }
  return {
    text: `About ${Math.ceil(pace)} pages a day to finish by ${target} (${daysLeft} ${
      daysLeft === 1 ? 'day' : 'days'
    } left).`,
    tone: 'neutral',
  }
}

export default function NowReadingCard({
  book,
  finishers = [],
  memberCount = 0,
  currentUserId = null,
  hasQueuedBooks = false,
}: Props) {
  if (!book) {
    return (
      <div className="card flex flex-col items-center px-6 py-12 text-center">
        <p className="eyebrow">Now reading</p>
        <h2 className="mt-2 text-2xl font-semibold text-stone-900">Nothing on the nightstand</h2>
        <p className="mt-1 max-w-sm text-sm text-stone-500">
          Pick the club&apos;s next book to start tracking progress, ratings and quotes.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link href="/books/new" className="btn btn-primary">
            Add the next book
          </Link>
          {hasQueuedBooks && (
            <Link href="/want-to-read" className="btn btn-secondary">
              Choose from the list
            </Link>
          )}
        </div>
      </div>
    )
  }

  const percent = progressPercent(book)
  const pace = paceMessage(book)
  const iFinished = finishers.some((f) => f.user_id === currentUserId)

  return (
    <div className="card flex flex-col gap-6 p-5 sm:flex-row sm:p-6">
      <BookCover
        coverUrl={book.cover_url}
        title={book.title}
        author={book.author}
        synopsis={book.synopsis}
        className="mx-auto aspect-[2/3] w-36 shrink-0 sm:mx-0 sm:w-40"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="eyebrow text-accent">Now reading</p>
            <Link href={`/books/${book.id}/edit`} className="btn btn-ghost btn-sm">
              Edit
            </Link>
          </div>
          <Link href={`/books/${book.id}`}>
            <h2 className="mt-1 text-3xl leading-tight font-semibold text-stone-900 hover:underline">
              {book.title}
            </h2>
          </Link>
          <p className="mt-1 text-stone-600">
            {book.author ? `by ${book.author}` : 'Unknown author'}
            {book.picker?.display_name && (
              <span className="text-stone-400"> · picked by {book.picker.display_name}</span>
            )}
          </p>
        </div>

        <div className="space-y-2">
          {percent !== null && (
            <div>
              <div className="mb-1 flex justify-between text-xs font-medium text-stone-500">
                <span>
                  {Math.max(0, (book.page_count ?? 0) - book.pages_read_so_far)} pages to go
                </span>
                <span className="tabular-nums">{percent}%</span>
              </div>
              <div
                className="h-2.5 overflow-hidden rounded-full bg-stone-200"
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Reading progress"
              >
                <div
                  className="h-full rounded-full bg-amber-500 transition-[width] duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )}
          <PagesReadForm
            key={book.pages_read_so_far}
            bookId={book.id}
            pagesReadSoFar={book.pages_read_so_far}
            pageCount={book.page_count}
          />
          {pace && (
            <p
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                pace.tone === 'warn'
                  ? 'bg-amber-50 text-amber-900'
                  : pace.tone === 'good'
                    ? 'bg-emerald-50 text-emerald-900'
                    : 'bg-stone-100 text-stone-800'
              }`}
            >
              {pace.text}
            </p>
          )}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-stone-100 pt-4">
          {currentUserId && <FinishButton bookId={book.id} isFinished={iFinished} />}
          <div className="flex items-center gap-2">
            {finishers.length > 0 && (
              <div className="flex -space-x-1.5">
                {finishers.map((f) => (
                  <Avatar
                    key={f.user_id}
                    name={f.profile.display_name}
                    url={f.profile.avatar_url}
                    size={7}
                    tooltip={`${f.profile.display_name} · finished ${new Date(
                      f.finished_at
                    ).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                  />
                ))}
              </div>
            )}
            <span className="text-xs text-stone-500">
              {finishers.length === 0
                ? 'Nobody has finished yet'
                : memberCount > 0
                  ? `${finishers.length} of ${memberCount} ready to discuss`
                  : `${finishers.length} ready to discuss`}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <ConfirmActionButton
              action={finishBook.bind(null, book.id)}
              confirmMessage={`Wrap up "${book.title}" and move it to History? You can rate it on the next screen.`}
              className="btn btn-secondary"
            >
              Wrap up book
            </ConfirmActionButton>
          </div>
        </div>
      </div>
    </div>
  )
}
