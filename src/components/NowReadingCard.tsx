import Link from 'next/link'
import { addDays, daysBetween, formatDate, todayStr } from '@/lib/dates'
import { daysToFinish, readingSchedule } from '@/lib/pace'
import { finishBook } from '@/lib/actions/books'
import Avatar from '@/components/Avatar'
import FinishButton from '@/components/FinishButton'
import BookCover from '@/components/BookCover'
import ConfirmActionButton from '@/components/ConfirmActionButton'
import type { Book, Profile } from '@/lib/types'

export type Finisher = {
  user_id: string
  finished_at: string
  profile: { display_name: string; avatar_url: string | null }
}

type Props = {
  book: (Book & { picker?: { display_name: string; avatar_url: string | null } | null }) | null
  finishers?: Finisher[]
  members?: Profile[]
  currentUserId?: string | null
  /** The signed-in member's rating of this book, if they've already given one. */
  myRating?: { rating: number | null; did_not_finish?: boolean | null } | null
  hasQueuedBooks?: boolean
}

const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th']
const PLACE_STYLES = [
  'bg-amber-300 text-amber-950',
  'bg-stone-300 text-stone-800',
  'bg-orange-300 text-orange-950',
]

function days(n: number): string {
  return `${n} ${n === 1 ? 'day' : 'days'}`
}

export default function NowReadingCard({
  book,
  finishers = [],
  members = [],
  currentUserId = null,
  myRating = null,
  hasQueuedBooks = false,
}: Props) {
  if (!book) {
    return (
      <div className="card flex flex-col items-center px-6 py-12 text-center">
        <p className="eyebrow">Now reading</p>
        <h2 className="mt-2 text-2xl font-semibold text-stone-900">Nothing on the nightstand</h2>
        <p className="mt-1 max-w-sm text-sm text-stone-500">
          Pick the club&apos;s next book to start the countdown, ratings and quotes.
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

  const schedule = readingSchedule(book)
  const finished = [...finishers].sort((a, b) => a.finished_at.localeCompare(b.finished_at))
  const finishedIds = new Set(finished.map((f) => f.user_id))
  const stillReading = members.filter((m) => !finishedIds.has(m.id))
  const iFinished = currentUserId !== null && finishedIds.has(currentUserId)
  const rateHref = `/books/${book.id}#rate`
  const myScore =
    myRating?.rating != null
      ? `${Number.isInteger(myRating.rating) ? myRating.rating : myRating.rating.toFixed(1)}/10`
      : myRating?.did_not_finish
        ? 'did not finish'
        : null
  const everyoneDone = members.length > 0 && stillReading.length === 0

  // Flags on the timeline: where in the reading window each person finished.
  const flags =
    book.date_started && schedule.totalDays
      ? finished.map((f, i) => {
          const finishDate = todayStr(new Date(f.finished_at))
          const elapsed = Math.max(0, daysBetween(book.date_started!, finishDate))
          const percent = Math.min(100, (elapsed / schedule.totalDays!) * 100)
          return {
            finisher: f,
            place: i,
            percent,
            label: `${f.profile.display_name} finished ${formatDate(finishDate, {
              withYear: false,
            })}`,
          }
        })
      : []

  // Evenly spaced calendar dates along the bar, from the start to the target.
  const ticks: { percent: number; date: string }[] = []
  if (book.date_started && schedule.totalDays) {
    const steps = Math.min(4, schedule.totalDays)
    for (let i = 0; i <= steps; i++) {
      const offset = Math.round((i / steps) * schedule.totalDays)
      ticks.push({
        percent: (offset / schedule.totalDays) * 100,
        date: addDays(book.date_started, offset),
      })
    }
  }
  const today = todayStr()

  const overdue = schedule.daysLeft !== null && schedule.daysLeft < 0
  const countdown =
    schedule.daysLeft === null
      ? null
      : overdue
        ? `${days(Math.abs(schedule.daysLeft))} over`
        : schedule.daysLeft === 0
          ? 'Due today'
          : `${days(schedule.daysLeft)} left`

  return (
    <div className="card flex flex-col gap-6 p-5 sm:flex-row sm:p-6">
      <Link
        href={rateHref}
        title="Open the book to rate it and jot down your thoughts"
        className="mx-auto w-36 shrink-0 self-start transition-transform hover:-translate-y-0.5 sm:mx-0 sm:w-40"
      >
        <BookCover
          coverUrl={book.cover_url}
          title={book.title}
          author={book.author}
          className="aspect-[2/3] w-full"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-5">
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

        {/* The countdown: worked out from the dates, nothing to log. */}
        {schedule.fraction !== null && schedule.totalDays !== null ? (
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-serif text-xl font-semibold text-stone-900">
                {everyoneDone
                  ? 'Everyone’s finished'
                  : `Finish by ${formatDate(book.target_finish_date, { withYear: false })}`}
              </p>
              <p
                className={`text-sm font-semibold tabular-nums ${
                  overdue && !everyoneDone ? 'text-rose-700' : 'text-stone-500'
                }`}
              >
                {countdown}
              </p>
            </div>
            {flags.length > 0 && (
              // Padded so a flag at either end of the bar isn't cut off.
              <div className="relative mx-3 mt-3 h-9" aria-label="When each person finished">
                {flags.map((flag) => {
                  // People who finished on the same day fan out instead of stacking.
                  const sameSpot = flags.filter(
                    (other) => other.place < flag.place && Math.abs(other.percent - flag.percent) < 4
                  ).length
                  return (
                    <span
                      key={flag.finisher.user_id}
                      className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center"
                      style={{ left: `${flag.percent}%`, marginLeft: sameSpot * 16, zIndex: 10 - flag.place }}
                    >
                      <Avatar
                        name={flag.finisher.profile.display_name}
                        url={flag.finisher.profile.avatar_url}
                        size={6}
                        tooltip={flag.label}
                      />
                      <span className="h-2.5 w-0.5 bg-stone-400" />
                    </span>
                  )
                })}
              </div>
            )}
            <div
              className={`${flags.length > 0 ? '' : 'mt-2 '}bar`}
              role="progressbar"
              aria-valuenow={Math.round(schedule.fraction * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Time used up before the target date"
            >
              <div
                className={`grow-x h-full rounded-full ${
                  overdue && !everyoneDone ? 'bg-rose-400' : 'bg-amber-400'
                }`}
                style={{ width: `${Math.max(2, schedule.fraction * 100)}%` }}
              />
            </div>
            {/* Calendar dates under the bar */}
            <div className="relative mx-3 mt-1 h-7" aria-hidden="true">
              {ticks.map((tick, i) => (
                <span
                  key={tick.date}
                  className={`absolute top-0 flex flex-col ${
                    i === 0
                      ? '-ml-3 items-start'
                      : i === ticks.length - 1
                        ? '-mr-3 -translate-x-full items-end'
                        : '-translate-x-1/2 items-center'
                  }`}
                  style={{ left: `${tick.percent}%` }}
                >
                  <span className="h-1.5 w-px bg-stone-300" />
                  <span className="mt-0.5 text-[11px] whitespace-nowrap text-stone-400 tabular-nums">
                    {formatDate(tick.date, { withYear: false })}
                  </span>
                </span>
              ))}
            </div>
            {!everyoneDone && schedule.onPacePage !== null && book.page_count && (
              <p className="panel mt-3 px-3 py-2 text-sm text-stone-700">
                {overdue ? (
                  <>The plan was to be done by now — all {book.page_count} pages.</>
                ) : (
                  <>
                    To be on pace today ({formatDate(today, { withYear: false })}) you&apos;d be
                    around{' '}
                    <span className="font-semibold text-stone-900">
                      page {Math.max(1, schedule.onPacePage)}
                    </span>{' '}
                    of {book.page_count}
                    {schedule.pagesPerDay !== null && (
                      <span className="text-stone-500">
                        {' '}
                        (about {Math.ceil(schedule.pagesPerDay)} pages a day)
                      </span>
                    )}
                    .
                  </>
                )}
              </p>
            )}
          </div>
        ) : (
          <p className="panel px-3 py-2 text-sm text-stone-700">
            {book.date_started
              ? `Started ${formatDate(book.date_started, { withYear: false })}. `
              : ''}
            <Link href={`/books/${book.id}/edit`} className="font-semibold text-accent hover:underline">
              Set a target date
            </Link>{' '}
            to get a countdown and a page to aim for each day.
          </p>
        )}

        {/* The finish line: who's done, in order, and who everyone is waiting on. */}
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <p className="eyebrow">The finish line</p>
            {members.length > 0 && (
              <p className="text-xs text-stone-500">
                {finished.length} of {members.length} finished
              </p>
            )}
          </div>
          {finished.length > 0 ? (
            <ol className="mt-2 space-y-1.5">
              {finished.map((f, i) => {
                const took = daysToFinish(book.date_started, f.finished_at)
                return (
                  <li key={f.user_id} className="flex items-center gap-2.5 text-sm">
                    <span
                      className={`inline-flex h-7 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink text-xs font-extrabold ${
                        PLACE_STYLES[i] ?? 'bg-white text-stone-700'
                      }`}
                    >
                      {ORDINALS[i] ?? `${i + 1}th`}
                    </span>
                    <Avatar
                      name={f.profile.display_name}
                      url={f.profile.avatar_url}
                      size={6}
                      showTooltip={false}
                    />
                    <span className="min-w-0 truncate font-medium text-stone-900">
                      {f.profile.display_name}
                    </span>
                    <span className="ml-auto shrink-0 text-xs whitespace-nowrap text-stone-500">
                      {formatDate(todayStr(new Date(f.finished_at)), { withYear: false })}
                      {took !== null ? ` · ${days(took)}` : ''}
                    </span>
                  </li>
                )
              })}
            </ol>
          ) : (
            <p className="mt-2 text-sm text-stone-500">
              Nobody has finished yet. First place is up for grabs.
            </p>
          )}
          {stillReading.length > 0 && finished.length > 0 && (
            <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-stone-500">
              <span className="flex -space-x-1.5">
                {stillReading.map((m) => (
                  <Avatar key={m.id} name={m.display_name} url={m.avatar_url} size={6} />
                ))}
              </span>
              {stillReading.length === 1
                ? `Everyone’s waiting on ${stillReading[0].display_name}.`
                : `Still reading: ${stillReading.map((m) => m.display_name).join(', ')}.`}
            </p>
          )}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 border-t-2 border-dashed border-stone-200 pt-4">
          {currentUserId && <FinishButton bookId={book.id} isFinished={iFinished} />}
          {!iFinished && !myScore && currentUserId && (
            <span className="text-xs text-stone-500">Emails the whole club that you&apos;re done.</span>
          )}
          {currentUserId && myScore ? (
            <Link href={rateHref} className="btn btn-secondary">
              Your rating: {myScore}
            </Link>
          ) : (
            currentUserId &&
            iFinished && (
              <Link href={rateHref} className="btn btn-primary">
                Rate &amp; review
              </Link>
            )
          )}
          <div className="flex items-center gap-2 sm:ml-auto">
            <ConfirmActionButton
              action={finishBook.bind(null, book.id)}
              confirmMessage={`Wrap up "${book.title}" and move it to History? Ratings and notes already given carry over.`}
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
