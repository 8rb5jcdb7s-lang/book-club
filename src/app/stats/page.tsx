import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Avatar from '@/components/Avatar'
import BookCover from '@/components/BookCover'
import CountUp from '@/components/CountUp'
import ScoreBadge from '@/components/ScoreBadge'
import WordCountCard from '@/components/WordCountCard'
import { todayStr, yearOf } from '@/lib/dates'
import {
  availableYears,
  averagePace,
  averageRatingOverall,
  bestWorstRated,
  biggestDisagreement,
  booksFinished,
  distinctAuthors,
  fastestSlowestReads,
  finishedInOrder,
  finishSummaries,
  genreBreakdown,
  longestGapDays,
  longestShortestBooks,
  memberSummaries,
  mostAbandoned,
  pagesByMonth,
  pickerLeaderboard,
  quoteWall,
  raterStats,
  ratingDistribution,
  tasteMatches,
  totalDaysReading,
  totalPagesRead,
  totalWordsInYear,
  type TastePair,
} from '@/lib/stats'
import { WORDS_PER_PAGE } from '@/lib/wordCount'
import type { Book, Profile } from '@/lib/types'

export const metadata: Metadata = { title: 'Stats' }

function Award({
  label,
  book,
  detail,
}: {
  label: string
  book: Book | null | undefined
  detail?: string
}) {
  if (!book) return null
  return (
    <Link
      href={`/books/${book.id}`}
      className="card group flex items-center gap-4 p-4 transition-shadow hover:shadow-md"
    >
      <BookCover
        coverUrl={book.cover_url}
        title={book.title}
        author={book.author}
        className="h-24 w-16 shrink-0"
      />
      <div className="min-w-0">
        <p className="eyebrow text-accent">{label}</p>
        <p className="mt-1 line-clamp-2 font-serif text-lg leading-snug font-semibold text-stone-900 group-hover:underline">
          {book.title}
        </p>
        {detail && <p className="mt-0.5 text-sm text-stone-500">{detail}</p>}
      </div>
    </Link>
  )
}

function Leaderboard({
  title,
  subtitle,
  rows,
}: {
  title: string
  subtitle: string
  rows: { profile: Profile; averageRating: number; detail: string }[]
}) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="section-title">{title}</h2>
      <p className="text-sm text-stone-500">{subtitle}</p>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-stone-400">Not enough ratings yet.</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {rows.map((row, i) => (
            <li key={row.profile.id} className="flex items-center gap-3">
              <span className="w-4 text-sm font-semibold text-stone-400 tabular-nums">{i + 1}</span>
              <Avatar
                name={row.profile.display_name}
                url={row.profile.avatar_url}
                size={8}
                showTooltip={false}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-medium text-stone-900">
                    {row.profile.display_name}
                  </span>
                  <span className="text-xs whitespace-nowrap text-stone-400">{row.detail}</span>
                </div>
                <div className="bar mt-1 h-3">
                  <div
                    className="grow-x bar-fill"
                    style={{ width: `${row.averageRating * 10}%`, animationDelay: `${i * 80}ms` }}
                  />
                </div>
              </div>
              <ScoreBadge rating={row.averageRating} size="sm" />
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function TasteRow({ label, pair, tone }: { label: string; pair: TastePair; tone: string }) {
  return (
    <div className={`rounded-2xl border-2 border-ink p-4 ${tone}`}>
      <p className="eyebrow">{label}</p>
      <div className="mt-2 flex items-center gap-3">
        <div className="flex -space-x-2">
          <Avatar name={pair.a.display_name} url={pair.a.avatar_url} size={10} showTooltip={false} />
          <Avatar name={pair.b.display_name} url={pair.b.avatar_url} size={10} showTooltip={false} />
        </div>
        <div className="min-w-0">
          <p className="font-serif text-lg leading-tight font-semibold text-stone-900">
            {pair.a.display_name} &amp; {pair.b.display_name}
          </p>
          <p className="text-sm text-stone-600">
            {pair.averageGap < 0.05
              ? 'Identical scores'
              : `${pair.averageGap.toFixed(1)} points apart on average`}{' '}
            across {pair.sharedBooks} books
          </p>
        </div>
      </div>
    </div>
  )
}

function stackHeight(pages: number): string {
  // ~0.05 mm of thickness per printed page (two pages per sheet).
  const inches = (pages * 0.05) / 25.4
  if (inches >= 12) return `${(inches / 12).toFixed(1)} feet`
  return `${inches.toFixed(1)} inches`
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const { year: yearParam } = await searchParams
  const supabase = await createClient()

  const [
    { data: books },
    { data: ratingsNotes },
    { data: profiles },
    { data: quotes },
    { data: finishes },
  ] = await Promise.all([
      supabase.from('books').select('*'),
      supabase.from('ratings_notes').select('*'),
      supabase.from('profiles').select('*'),
      supabase.from('quotes').select('*'),
      supabase.from('book_finishes').select('*'),
    ])

  const allBooks = books ?? []
  const p = profiles ?? []

  const years = availableYears(allBooks)
  const year = years.find((y) => String(y) === yearParam) ?? null

  // Everything below is scoped to the selected year (or all time).
  const b = year
    ? allBooks.filter(
        (book) =>
          book.status === 'finished' && book.date_finished && yearOf(book.date_finished) === year
      )
    : allBooks.filter((book) => book.status === 'finished')
  const bookIds = new Set(b.map((book) => book.id))
  const rn = (ratingsNotes ?? []).filter((r) => bookIds.has(r.book_id))
  const q = (quotes ?? []).filter((quote) => bookIds.has(quote.book_id))

  const count = booksFinished(b)
  const pages = totalPagesRead(b)
  const hours = Math.round((pages * WORDS_PER_PAGE) / 250 / 60)
  const authors = distinctAuthors(b)
  const pace = averagePace(b)
  const avgRating = averageRatingOverall(rn)
  const gap = longestGapDays(b)

  const shelf = finishedInOrder(b)
  const months = pagesByMonth(b, year)
  const maxMonthPages = Math.max(1, ...months.map((m) => m.pages))
  const busiest = months.reduce<(typeof months)[number] | null>(
    (best, m) => (m.pages > (best?.pages ?? 0) ? m : best),
    null
  )

  const { longest, shortest } = longestShortestBooks(b)
  const { fastest, slowest } = fastestSlowestReads(b)
  const { best, worst } = bestWorstRated(b, rn)
  const disagreements = biggestDisagreement(b, rn)
  const abandoned = mostAbandoned(b, rn)
  const racers = finishSummaries(b, finishes ?? [], p)
  const quickest = racers
    .filter((r) => r.fastest)
    .sort((x, y) => x.fastest!.days - y.fastest!.days)[0]
  const distribution = ratingDistribution(rn)
  const maxDistribution = Math.max(1, ...distribution)
  const totalRatings = distribution.reduce((sum, n) => sum + n, 0)
  const members = memberSummaries(b, rn, q, p).filter(
    (m) => m.ratingCount > 0 || m.pickCount > 0 || m.quoteCount > 0 || m.dnfCount > 0
  )
  const { closest, furthest } = tasteMatches(rn, p)
  const pickers = pickerLeaderboard(b, rn, p)
  const raters = raterStats(rn, p)
  const genres = genreBreakdown(b)
  const maxGenreCount = Math.max(1, ...genres.map((g) => g.count))
  const quotesWithContext = quoteWall(q, b, p)
  const wordsYear = year ?? yearOf(todayStr())

  const scopeLabel = year ? `in ${year}` : 'together'

  return (
    <div className="space-y-8 sm:space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Stats</h1>
          <p className="mt-1 text-sm text-stone-500">Everything we&apos;ve read, recapped.</p>
        </div>
        {years.length > 0 && (
          <nav
            aria-label="Time range"
            className="no-scrollbar -mx-1 flex max-w-full gap-1 overflow-x-auto rounded-full bg-stone-200/70 p-1"
          >
            {[null, ...years].map((y) => {
              const active = y === year
              return (
                <Link
                  key={y ?? 'all'}
                  href={y ? `/stats?year=${y}` : '/stats'}
                  scroll={false}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-full border-2 px-3 py-0.5 text-sm font-extrabold whitespace-nowrap transition-colors ${
                    active ? 'border-ink bg-sun text-ink' : 'border-transparent text-stone-600 hover:text-ink'
                  }`}
                >
                  {y ?? 'All time'}
                </Link>
              )
            })}
          </nav>
        )}
      </div>

      {count === 0 ? (
        <p className="empty-state">
          No finished books {year ? `in ${year}` : 'yet'}. Stats appear here as soon as the club
          wraps up its first book.
        </p>
      ) : (
        <>
          {/* Hero */}
          <section className="overflow-hidden rounded-3xl border-2 border-ink bg-ink text-stone-100 shadow-[0_5px_0_0_#a8a29e]">
            <div className="px-5 pt-6 sm:px-8 sm:pt-8">
              <p className="text-xs font-semibold tracking-wider text-amber-400 uppercase">
                {year ? `${year} in review` : 'The story so far'}
              </p>
              <h2 className="mt-2 text-3xl leading-tight font-semibold text-white sm:text-5xl">
                <CountUp value={count} /> {count === 1 ? 'book' : 'books'} read {scopeLabel}
              </h2>

              <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
                {[
                  { label: 'Pages turned', value: pages, decimals: 0 },
                  { label: 'Hours of reading', value: hours, decimals: 0 },
                  { label: 'Different authors', value: authors, decimals: 0 },
                  ...(avgRating !== null
                    ? [{ label: 'Average rating', value: avgRating, decimals: 1 }]
                    : []),
                ].map((stat) => (
                  <div key={stat.label}>
                    <dd className="font-serif text-3xl font-semibold text-white sm:text-4xl">
                      <CountUp value={stat.value} decimals={stat.decimals} />
                    </dd>
                    <dt className="mt-0.5 text-sm text-stone-400">{stat.label}</dt>
                  </div>
                ))}
              </dl>
            </div>

            {/* The shelf: every book, in the order we read them */}
            <div className="no-scrollbar mt-7 flex items-end gap-3 overflow-x-auto px-5 pb-6 sm:px-8 sm:pb-8">
              {shelf.map((book, i) => (
                <Link
                  key={book.id}
                  href={`/books/${book.id}`}
                  title={book.title}
                  className="rise-in shrink-0 transition-transform hover:-translate-y-1.5"
                  style={{ animationDelay: `${Math.min(i, 12) * 60}ms` }}
                >
                  <BookCover
                    coverUrl={book.cover_url}
                    title={book.title}
                    author={book.author}
                    className="h-32 w-[5.33rem] sm:h-40 sm:w-[6.67rem]"
                  />
                </Link>
              ))}
            </div>
          </section>

          {/* Fun facts */}
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                big: stackHeight(pages),
                text: 'of paper if you stacked every page we read',
              },
              pace !== null
                ? { big: `${pace.toFixed(1)} pages`, text: 'a day is our average pace' }
                : null,
              busiest && busiest.pages > 0
                ? {
                    big: busiest.label,
                    text: `was our biggest month: ${busiest.pages.toLocaleString()} pages`,
                  }
                : null,
              gap !== null
                ? { big: `${gap} days`, text: 'was our longest wait between finishing books' }
                : {
                    big: `${totalDaysReading(b).toLocaleString()} days`,
                    text: 'spent with a book on the go',
                  },
            ]
              .filter((fact): fact is { big: string; text: string } => fact !== null)
              .map((fact) => (
                <li key={fact.text} className="card p-4">
                  <p className="font-serif text-2xl font-semibold text-stone-900">{fact.big}</p>
                  <p className="mt-0.5 text-sm text-stone-500">{fact.text}</p>
                </li>
              ))}
          </ul>

          {/* Timeline */}
          {months.length > 1 && (
            <section className="card p-5 sm:p-6">
              <h2 className="section-title">Pages by month</h2>
              <p className="text-sm text-stone-500">
                Counted in the month each book was finished. Tap or hover a bar to see the books.
              </p>
              <div className="no-scrollbar mt-5 overflow-x-auto">
                <ol
                  className="grid h-48 items-end gap-1.5 sm:gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${months.length}, minmax(3rem, 1fr))`,
                    minWidth: `${months.length * 3.25}rem`,
                  }}
                >
                  {months.map((month, i) => (
                    <li
                      key={month.key}
                      className="group/month relative flex h-full flex-col justify-end"
                      tabIndex={month.pages > 0 ? 0 : undefined}
                    >
                      {month.pages > 0 && (
                        <>
                          <span className="mb-1 text-center text-[11px] font-medium text-stone-500 tabular-nums">
                            {month.pages.toLocaleString()}
                          </span>
                          <span className="tooltip bottom-full left-1/2 mb-1 flex -translate-x-1/2 flex-col group-hover/month:opacity-100 group-focus/month:opacity-100">
                            {month.titles.map((title) => (
                              <span key={title} className="max-w-48 truncate">
                                {title}
                              </span>
                            ))}
                          </span>
                        </>
                      )}
                      <span
                        className={`grow-y block rounded-t-xl ${
                          month.pages > 0
                            ? 'border-2 border-b-0 border-ink bg-amber-400 group-hover/month:bg-amber-500'
                            : 'bg-stone-200'
                        }`}
                        style={{
                          height: month.pages > 0 ? `${Math.max(6, (month.pages / maxMonthPages) * 78)}%` : '3px',
                          animationDelay: `${Math.min(i, 16) * 40}ms`,
                        }}
                      />
                      <span className="mt-1.5 text-center text-[11px] whitespace-nowrap text-stone-400">
                        {month.label}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          )}

          {/* Awards */}
          <section>
            <h2 className="section-title mb-3">The awards</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Award
                label="Crowd favorite"
                book={best?.book}
                detail={best ? `${best.rating.toFixed(1)} / 10 average` : undefined}
              />
              <Award
                label="Wooden spoon"
                book={worst && worst.book.id !== best?.book.id ? worst.book : null}
                detail={worst ? `${worst.rating.toFixed(1)} / 10 average` : undefined}
              />
              <Award
                label="Most divisive"
                book={disagreements[0]?.book}
                detail={
                  disagreements[0]
                    ? `Scores from ${disagreements[0].min} to ${disagreements[0].max}`
                    : undefined
                }
              />
              <Award
                label="The one that got away"
                book={abandoned?.book}
                detail={
                  abandoned
                    ? `${abandoned.count} ${abandoned.count === 1 ? 'person' : 'people'} didn’t finish it`
                    : undefined
                }
              />
              <Award
                label="The marathon"
                book={longest}
                detail={longest ? `${longest.page_count?.toLocaleString()} pages` : undefined}
              />
              <Award
                label="The quick one"
                book={shortest && shortest.id !== longest?.id ? shortest : null}
                detail={shortest ? `${shortest.page_count} pages` : undefined}
              />
              <Award
                label="Couldn’t put it down"
                book={fastest?.book}
                detail={fastest ? `${fastest.pace.toFixed(1)} pages a day` : undefined}
              />
              <Award
                label="Fastest to the finish"
                book={quickest?.fastest?.book}
                detail={
                  quickest?.fastest
                    ? `${quickest.profile.display_name}, in ${quickest.fastest.days} ${
                        quickest.fastest.days === 1 ? 'day' : 'days'
                      }`
                    : undefined
                }
              />
              <Award
                label="The slow burn"
                book={slowest && slowest.book.id !== fastest?.book.id ? slowest.book : null}
                detail={slowest ? `${slowest.pace.toFixed(1)} pages a day` : undefined}
              />
            </div>
          </section>

          {/* How we rate */}
          {totalRatings > 0 && (
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="card p-5 sm:p-6">
                <h2 className="section-title">How we score</h2>
                <p className="text-sm text-stone-500">
                  All {totalRatings} ratings{year ? ` from ${year}` : ''}, by score. Half points
                  count with the number below.
                </p>
                <ol className="mt-5 grid h-40 grid-cols-10 items-end gap-1.5 sm:gap-2">
                  {distribution.map((n, i) => (
                    <li key={i} className="flex h-full flex-col justify-end">
                      {n > 0 && (
                        <span className="mb-1 text-center text-xs font-medium text-stone-500 tabular-nums">
                          {n}
                        </span>
                      )}
                      <span
                        className={`grow-y block rounded-t-xl ${n > 0 ? "border-2 border-b-0 border-ink" : ""}`}
                        style={{
                          height: n > 0 ? `${Math.max(6, (n / maxDistribution) * 80)}%` : '3px',
                          backgroundColor:
                            n > 0 ? `hsl(${(i / 9) * 120}, 75%, 72%)` : 'var(--color-stone-200)',
                          animationDelay: `${i * 50}ms`,
                        }}
                      />
                      <span className="mt-1.5 text-center text-xs font-semibold text-stone-500 tabular-nums">
                        {i + 1}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="card flex flex-col p-5 sm:p-6">
                <h2 className="section-title">Taste test</h2>
                <p className="text-sm text-stone-500">
                  Whose scores line up — and whose really don&apos;t.
                </p>
                {closest ? (
                  <div className="mt-4 grid flex-1 content-start gap-3">
                    <TasteRow label="Most in sync" pair={closest} tone="bg-emerald-100" />
                    {furthest && furthest.averageGap > closest.averageGap && (
                      <TasteRow label="Agree to disagree" pair={furthest} tone="bg-rose-100" />
                    )}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-stone-400">
                    This unlocks once two people have rated at least two of the same books.
                  </p>
                )}
              </section>
            </div>
          )}

          {/* Members */}
          {members.length > 0 && (
            <section>
              <h2 className="section-title mb-3">The readers</h2>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {members.map((m) => (
                  <li key={m.profile.id} className="card flex flex-col p-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={m.profile.display_name}
                        url={m.profile.avatar_url}
                        size={11}
                        showTooltip={false}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-serif text-lg font-semibold text-stone-900">
                          {m.profile.display_name}
                        </p>
                        <p className="text-xs text-stone-500">
                          {m.pickCount} {m.pickCount === 1 ? 'pick' : 'picks'} · {m.quoteCount}{' '}
                          {m.quoteCount === 1 ? 'quote' : 'quotes'}
                          {m.dnfCount > 0 && ` · ${m.dnfCount} unfinished`}
                        </p>
                      </div>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-2 text-center">
                      <div className="rounded-2xl bg-stone-100 px-2 py-2">
                        <dd className="font-serif text-xl font-semibold text-stone-900 tabular-nums">
                          {m.averageGiven !== null ? m.averageGiven.toFixed(1) : '—'}
                        </dd>
                        <dt className="text-[11px] text-stone-500">avg score given</dt>
                      </div>
                      <div className="rounded-2xl bg-stone-100 px-2 py-2">
                        <dd className="font-serif text-xl font-semibold text-stone-900 tabular-nums">
                          {m.averagePickRating !== null ? m.averagePickRating.toFixed(1) : '—'}
                        </dd>
                        <dt className="text-[11px] text-stone-500">avg for their picks</dt>
                      </div>
                    </dl>
                    <div className="mt-3 space-y-1.5 text-sm">
                      {m.favorite && (
                        <p className="flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate text-stone-600">
                            <span className="text-stone-400">Loved </span>
                            <Link href={`/books/${m.favorite.book.id}`} className="font-medium text-stone-800 hover:underline">
                              {m.favorite.book.title}
                            </Link>
                          </span>
                          <ScoreBadge rating={m.favorite.rating} size="sm" decimals={0} />
                        </p>
                      )}
                      {m.leastFavorite && m.leastFavorite.rating < (m.favorite?.rating ?? 0) && (
                        <p className="flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate text-stone-600">
                            <span className="text-stone-400">Not so much </span>
                            <Link href={`/books/${m.leastFavorite.book.id}`} className="font-medium text-stone-800 hover:underline">
                              {m.leastFavorite.book.title}
                            </Link>
                          </span>
                          <ScoreBadge rating={m.leastFavorite.rating} size="sm" decimals={0} />
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Race to the finish */}
          {racers.length > 0 && (
            <section className="card p-5 sm:p-6">
              <h2 className="section-title">Race to the finish</h2>
              <p className="text-sm text-stone-500">
                From the “I finished it!” button: who crosses the line first, and who keeps
                everyone waiting.
              </p>
              <div className="no-scrollbar mt-4 overflow-x-auto">
                <table className="w-full min-w-[26rem] text-sm">
                  <thead className="text-left text-xs font-semibold tracking-wider text-stone-500 uppercase">
                    <tr>
                      <th className="pb-2 font-semibold">Reader</th>
                      <th className="pb-2 text-center font-semibold">Finished 1st</th>
                      <th className="pb-2 text-center font-semibold">Finished last</th>
                      <th className="pb-2 text-right font-semibold">Avg. days</th>
                      <th className="pb-2 text-right font-semibold">Books logged</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {racers.map((r) => (
                      <tr key={r.profile.id}>
                        <td className="py-2.5">
                          <span className="flex items-center gap-2 font-medium text-stone-900">
                            <Avatar
                              name={r.profile.display_name}
                              url={r.profile.avatar_url}
                              size={7}
                              showTooltip={false}
                            />
                            {r.profile.display_name}
                          </span>
                        </td>
                        <td className="py-2.5 text-center">
                          <span
                            className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 font-bold tabular-nums ${
                              r.firsts > 0 ? 'border-2 border-ink bg-sun text-ink' : 'text-stone-300'
                            }`}
                          >
                            {r.firsts}
                          </span>
                        </td>
                        <td className="py-2.5 text-center">
                          <span
                            className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 font-bold tabular-nums ${
                              r.lasts > 0 ? 'border-2 border-ink bg-rose-200 text-ink' : 'text-stone-300'
                            }`}
                          >
                            {r.lasts}
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-stone-700 tabular-nums">
                          {r.averageDays !== null ? r.averageDays.toFixed(0) : '—'}
                        </td>
                        <td className="py-2.5 text-right text-stone-500 tabular-nums">
                          {r.finishCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Leaderboard
              title="Best picker"
              subtitle="Average rating of the books each person picked."
              rows={pickers.map((x) => ({
                profile: x.profile,
                averageRating: x.averageRating,
                detail: `${x.bookCount} ${x.bookCount === 1 ? 'pick' : 'picks'}`,
              }))}
            />
            <Leaderboard
              title="Softest touch → toughest critic"
              subtitle="Average rating each person hands out."
              rows={raters.map((x) => ({
                profile: x.profile,
                averageRating: x.averageRating,
                detail: `${x.ratingCount} ${x.ratingCount === 1 ? 'rating' : 'ratings'}`,
              }))}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card p-5 sm:p-6">
              <h2 className="section-title">Genres</h2>
              <ul className="mt-4 space-y-2.5">
                {genres.map((g, i) => (
                  <li
                    key={g.genre}
                    className="grid grid-cols-[minmax(0,8rem)_1fr_1.5rem] items-center gap-3 text-sm"
                  >
                    <span className="truncate text-stone-700">{g.genre}</span>
                    <span className="bar h-3">
                      <span
                        className="grow-x block h-full rounded-full bg-sky-300"
                        style={{
                          width: `${(g.count / maxGenreCount) * 100}%`,
                          animationDelay: `${i * 60}ms`,
                        }}
                      />
                    </span>
                    <span className="text-right font-semibold text-stone-900 tabular-nums">
                      {g.count}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card p-5 sm:p-6">
              <h2 className="section-title">Biggest disagreements</h2>
              {disagreements.length === 0 ? (
                <p className="mt-4 text-sm text-stone-400">
                  None yet — everyone&apos;s been suspiciously aligned.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {disagreements.slice(0, 5).map((d) => (
                    <li key={d.book.id} className="flex items-center justify-between gap-3 text-sm">
                      <Link
                        href={`/books/${d.book.id}`}
                        className="truncate font-medium text-stone-900 hover:underline"
                      >
                        {d.book.title}
                      </Link>
                      <span className="flex shrink-0 items-center gap-1.5 text-xs text-stone-400">
                        <ScoreBadge rating={d.min} size="sm" decimals={0} />
                        to
                        <ScoreBadge rating={d.max} size="sm" decimals={0} />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <WordCountCard totalWords={totalWordsInYear(allBooks, wordsYear)} year={wordsYear} />

          <section>
            <h2 className="section-title mb-3">Quote wall</h2>
            {quotesWithContext.length === 0 ? (
              <p className="empty-state">
                No quotes saved yet. Add favorite lines from any book&apos;s page.
              </p>
            ) : (
              <ul className="gap-4 sm:columns-2 lg:columns-3">
                {quotesWithContext.map((quote) => (
                  <li
                    key={quote.id}
                    className="card mb-5 break-inside-avoid bg-amber-50 p-4"
                  >
                    <blockquote className="font-serif leading-relaxed text-stone-800 italic">
                      “{quote.quote_text}”
                    </blockquote>
                    <p className="mt-2 text-xs text-stone-500">
                      <Link href={`/books/${quote.book_id}`} className="font-medium hover:underline">
                        {quote.bookTitle}
                      </Link>
                      {quote.page_number ? `, p. ${quote.page_number}` : ''} · saved by{' '}
                      {quote.authorName}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
