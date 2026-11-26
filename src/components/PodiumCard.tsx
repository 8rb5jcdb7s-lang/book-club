import Link from 'next/link'
import BookCover from '@/components/BookCover'

export type PodiumEntry = {
  book: { id: string; title: string; author: string | null; cover_url: string | null }
  average: number
  ratingCount: number
}

// Display order is 2nd, 1st, 3rd so the winner stands in the middle.
const PLACES = [
  {
    place: 2,
    label: '2nd',
    block: 'h-20 bg-slate-300',
    blockShade: 'bg-slate-400',
    medal: 'bg-slate-200 text-slate-800',
    tilt: '-rotate-3',
    delay: '120ms',
  },
  {
    place: 1,
    label: '1st',
    block: 'h-28 bg-amber-300',
    blockShade: 'bg-amber-400',
    medal: 'bg-amber-300 text-amber-950',
    tilt: 'rotate-1',
    delay: '0ms',
  },
  {
    place: 3,
    label: '3rd',
    block: 'h-14 bg-orange-300',
    blockShade: 'bg-orange-400',
    medal: 'bg-orange-300 text-orange-950',
    tilt: 'rotate-3',
    delay: '240ms',
  },
] as const

function Crown() {
  return (
    <svg viewBox="0 0 48 32" className="podium-bob mx-auto h-7 w-10" aria-hidden="true">
      <path
        d="M5 27 L3 9 L15 18 L24 4 L33 18 L45 9 L43 27 Z"
        fill="#fbbf24"
        stroke="#2b2520"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="3" cy="8" r="3" fill="#f87171" stroke="#2b2520" strokeWidth="2" />
      <circle cx="24" cy="4" r="3" fill="#60a5fa" stroke="#2b2520" strokeWidth="2" />
      <circle cx="45" cy="8" r="3" fill="#34d399" stroke="#2b2520" strokeWidth="2" />
    </svg>
  )
}

function Sparkle({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`podium-twinkle absolute ${className}`} aria-hidden="true">
      <path
        d="M12 1 L14.500 9.500 L23 12 L14.500 14.500 L12 23 L9.500 14.500 L1 12 L9.500 9.500 Z"
        fill="#fbbf24"
        stroke="#2b2520"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** The club's three highest-rated books, drawn as a cartoon winners' podium. */
export default function PodiumCard({ entries }: { entries: PodiumEntry[] }) {
  const byPlace = new Map(entries.slice(0, 3).map((entry, i) => [i + 1, entry]))

  return (
    <div className="card overflow-hidden p-5 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="eyebrow">Hall of fame</p>
          <h2 className="mt-0.5 text-xl font-semibold text-ink">Our top three</h2>
        </div>
        <Link href="/stats" className="btn btn-ghost btn-sm -mr-2">
          All stats
        </Link>
      </div>

      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500">
          The podium is empty. Rate a finished book and it will climb up here.
        </p>
      ) : (
        <div className="relative mt-6">
          <Sparkle className="top-0 left-[8%] h-4 w-4" />
          <Sparkle className="top-10 right-[6%] h-3 w-3 [animation-delay:0.7s]" />
          <Sparkle className="top-2 right-[30%] h-2.5 w-2.5 [animation-delay:1.3s]" />

          <ol className="relative grid grid-cols-3 items-end gap-2">
            {PLACES.map((spot) => {
              const entry = byPlace.get(spot.place)
              return (
                <li key={spot.place} className="flex min-w-0 flex-col items-center">
                  {entry ? (
                    <Link
                      href={`/books/${entry.book.id}`}
                      title={`${entry.book.title} — ${entry.average.toFixed(1)} / 10`}
                      className="group rise-in flex w-full flex-col items-center"
                      style={{ animationDelay: spot.delay }}
                    >
                      {spot.place === 1 && <Crown />}
                      <span
                        className={`relative mb-1.5 block w-[78%] max-w-24 transition-transform duration-200 group-hover:-translate-y-1.5 group-hover:rotate-0 ${spot.tilt}`}
                      >
                        <BookCover
                          coverUrl={entry.book.cover_url}
                          title={entry.book.title}
                          author={entry.book.author}
                          className="aspect-[2/3] w-full"
                        />
                        <span
                          className={`absolute -top-2.5 -right-2.5 flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink text-xs font-extrabold tabular-nums shadow-[0_2px_0_0_var(--color-ink)] ${spot.medal}`}
                        >
                          {entry.average.toFixed(1)}
                        </span>
                      </span>
                    </Link>
                  ) : (
                    <span className="mb-1.5 flex aspect-[2/3] w-[78%] max-w-24 items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 text-2xl text-stone-300">
                      ?
                    </span>
                  )}

                  {/* The podium block */}
                  <span
                    className={`relative flex w-full items-start justify-center rounded-t-lg border-2 border-b-0 border-ink pt-1.5 ${spot.block}`}
                  >
                    <span className={`absolute inset-x-0 top-0 h-2 rounded-t-md ${spot.blockShade} opacity-60`} />
                    <span className="relative font-serif text-2xl font-bold text-ink">
                      {spot.place}
                    </span>
                  </span>
                </li>
              )
            })}
          </ol>
          <div className="h-2 rounded-b-md border-2 border-ink bg-ink" />

          <ol className="mt-3 grid grid-cols-3 gap-2 text-center">
            {PLACES.map((spot) => {
              const entry = byPlace.get(spot.place)
              return (
                <li key={spot.place} className="min-w-0">
                  {entry ? (
                    <Link href={`/books/${entry.book.id}`} className="block hover:underline">
                      <span className="line-clamp-2 font-serif text-sm leading-tight font-semibold text-ink">
                        {entry.book.title}
                      </span>
                    </Link>
                  ) : (
                    <span className="text-xs text-stone-400">Up for grabs</span>
                  )}
                  {entry && (
                    <span className="mt-0.5 block text-[11px] text-stone-500">
                      {entry.ratingCount} {entry.ratingCount === 1 ? 'rating' : 'ratings'}
                    </span>
                  )}
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </div>
  )
}
