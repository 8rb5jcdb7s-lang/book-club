import Link from 'next/link'
import Avatar from '@/components/Avatar'
import { formatDate } from '@/lib/dates'
import PickerSelect from '@/components/PickerSelect'
import { describeDaysAgo, pickDate, type PickBook, type PickStatus } from '@/lib/picks'

// Green for someone who picked recently, through amber, to red for whoever
// has waited longest. Members who have never picked are the reddest.
function heat(status: PickStatus, maxDays: number) {
  const fraction = status.daysSince === null ? 1 : maxDays > 0 ? status.daysSince / maxDays : 0
  const hue = 120 * (1 - fraction)
  return {
    bar: `hsl(${hue}, 70%, 48%)`,
    background: `hsl(${hue}, 80%, 95%)`,
    text: `hsl(${hue}, 65%, 24%)`,
    width: `${Math.max(6, fraction * 100)}%`,
  }
}

/** Shows how long it has been since each member last picked a book. */
export default function PickTrackerCard({
  queue,
  recent = [],
}: {
  queue: PickStatus[]
  /** The latest picks, shown so a wrong "Picked by" can be fixed on the spot. */
  recent?: PickBook[]
}) {
  if (queue.length === 0) return null

  const upNext = queue[0]
  const maxDays = Math.max(0, ...queue.map((s) => s.daysSince ?? 0))
  const nobodyHasPicked = queue.every((s) => s.daysSince === null)
  const members = queue
    .map((s) => s.profile)
    .sort((a, b) => a.display_name.localeCompare(b.display_name))
  const unassigned = recent.filter((b) => !b.picked_by).length
  // "Due" goes by time waited; flag it when that person is also behind on picks.
  const fewestPicks = Math.min(...queue.map((s) => s.pickCount))
  const mostPicks = Math.max(...queue.map((s) => s.pickCount))
  const alsoBehind = mostPicks > fewestPicks && upNext.pickCount === fewestPicks

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Who&apos;s up to pick</p>
          <div className="mt-2 flex items-center gap-3">
            <Avatar
              name={upNext.profile.display_name}
              url={upNext.profile.avatar_url}
              size={11}
              showTooltip={false}
            />
            <div>
              <h2 className="text-2xl leading-tight font-semibold text-stone-900">
                {nobodyHasPicked ? 'Anyone’s turn' : `${upNext.profile.display_name} is due`}
              </h2>
              <p className="text-sm text-stone-500">
                {nobodyHasPicked
                  ? 'No picks recorded yet.'
                  : upNext.daysSince === null
                    ? 'Hasn’t picked a book yet.'
                    : `Longest wait — last picked ${describeDaysAgo(upNext.daysSince)}${
                        alsoBehind ? ', and has the fewest picks' : ''
                      }.`}
              </p>
            </div>
          </div>
        </div>
        <Link href="/books/new" className="btn btn-secondary">
          Add the next book
        </Link>
      </div>

      <ol className="mt-5 space-y-2">
        {queue.map((status) => {
          const colors = heat(status, maxDays)
          return (
            <li
              key={status.profile.id}
              className="relative overflow-hidden rounded-xl px-3 py-2.5"
              style={{ backgroundColor: colors.background }}
            >
              <div className="flex items-center gap-3">
                <Avatar
                  name={status.profile.display_name}
                  url={status.profile.avatar_url}
                  size={8}
                  showTooltip={false}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-stone-900">
                    {status.profile.display_name}
                    <span className="ml-2 text-xs font-normal text-stone-500">
                      {status.pickCount} {status.pickCount === 1 ? 'pick' : 'picks'}
                    </span>
                  </p>
                  <p className="truncate text-sm text-stone-600">
                    {status.lastBook ? (
                      <>
                        Last:{' '}
                        <Link
                          href={`/books/${status.lastBook.id}`}
                          className="font-medium text-stone-800 hover:underline"
                        >
                          {status.lastBook.title}
                        </Link>
                        <span className="text-stone-500">
                          {' '}
                          · {formatDate(status.lastDate, { withYear: false })}
                        </span>
                      </>
                    ) : (
                      'No picks yet'
                    )}
                  </p>
                </div>
                <p
                  className="shrink-0 text-right text-sm font-semibold whitespace-nowrap tabular-nums"
                  style={{ color: colors.text }}
                >
                  {status.daysSince === null ? 'Never' : describeDaysAgo(status.daysSince)}
                </p>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-white/60">
                <div
                  className="grow-x h-full"
                  style={{ width: colors.width, backgroundColor: colors.bar }}
                />
              </div>
            </li>
          )
        })}
      </ol>

{recent.length > 0 && (
        <details
          className="group mt-4 rounded-xl border border-stone-200"
          // Only set when it should start open, so the browser (not React)
          // owns the open/closed state after that.
          {...(unassigned > 0 ? { open: true } : {})}
        >
          <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium text-stone-700 select-none hover:text-stone-900">
            <span>
              Recent picks
              {unassigned > 0 && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                  {unassigned} with no picker
                </span>
              )}
            </span>
            <span className="text-xs font-normal text-stone-400 group-open:hidden">
              Something wrong? Fix it here
            </span>
          </summary>
          <ul className="divide-y divide-stone-100 border-t border-stone-100">
            {recent.map((book) => (
              <li
                key={book.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2 text-sm"
              >
                <span className="min-w-0">
                  <Link
                    href={`/books/${book.id}`}
                    className="font-medium text-stone-900 hover:underline"
                  >
                    {book.title}
                  </Link>
                  <span className="text-stone-400">
                    {' '}
                    · {formatDate(pickDate(book))}
                    {book.status === 'reading' && ' · reading now'}
                  </span>
                </span>
                <PickerSelect bookId={book.id} pickedBy={book.picked_by} members={members} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
