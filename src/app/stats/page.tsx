import { createClient } from '@/lib/supabase/server'
import Avatar from '@/components/Avatar'
import StatsCards from '@/components/StatsCards'
import {
  totalPagesRead,
  totalDaysReading,
  averagePace,
  longestShortestBooks,
  fastestSlowestReads,
  pickerLeaderboard,
  raterStats,
  biggestDisagreement,
  genreBreakdown,
  readingStreak,
  quoteWall,
} from '@/lib/stats'

export default async function StatsPage() {
  const supabase = await createClient()

  const [{ data: books }, { data: ratingsNotes }, { data: profiles }, { data: quotes }] =
    await Promise.all([
      supabase.from('books').select('*'),
      supabase.from('ratings_notes').select('*'),
      supabase.from('profiles').select('*'),
      supabase.from('quotes').select('*'),
    ])

  const b = books ?? []
  const rn = ratingsNotes ?? []
  const p = profiles ?? []
  const q = quotes ?? []

  const { longest, shortest } = longestShortestBooks(b)
  const { fastest, slowest } = fastestSlowestReads(b)
  const pace = averagePace(b)
  const pickers = pickerLeaderboard(b, rn, p)
  const raters = raterStats(rn, p)
  const disagreements = biggestDisagreement(b, rn)
  const genres = genreBreakdown(b)
  const quotesWithContext = quoteWall(q, b, p)

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-stone-900">Group Stats</h1>

      <StatsCards
        items={[
          { label: 'Total pages read', value: totalPagesRead(b).toLocaleString() },
          { label: 'Total days reading', value: totalDaysReading(b).toLocaleString() },
          { label: 'Average pace', value: pace ? `${pace.toFixed(1)} pg/day` : '—' },
          { label: 'Books finished', value: readingStreak(b).toString() },
        ]}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <section>
          <h2 className="mb-2 text-lg font-bold text-stone-900">Longest & shortest</h2>
          <ul className="space-y-1 text-sm text-stone-700">
            <li>
              Longest: {longest ? `${longest.title} (${longest.page_count} pages)` : '—'}
            </li>
            <li>
              Shortest: {shortest ? `${shortest.title} (${shortest.page_count} pages)` : '—'}
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-stone-900">Fastest & slowest reads</h2>
          <ul className="space-y-1 text-sm text-stone-700">
            <li>
              Fastest:{' '}
              {fastest ? `${fastest.book.title} (${fastest.pace.toFixed(1)} pg/day)` : '—'}
            </li>
            <li>
              Slowest:{' '}
              {slowest ? `${slowest.book.title} (${slowest.pace.toFixed(1)} pg/day)` : '—'}
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-stone-900">Picker leaderboard</h2>
          {pickers.length === 0 ? (
            <p className="text-sm text-stone-500">Not enough data yet.</p>
          ) : (
            <ul className="space-y-1 text-sm text-stone-700">
              {pickers.map((p) => (
                <li key={p.profile.id} className="flex items-center gap-2">
                  <Avatar name={p.profile.display_name} url={p.profile.avatar_url} size={6} />
                  {p.profile.display_name}: {p.averageRating.toFixed(1)}/10 avg (
                  {p.bookCount} {p.bookCount === 1 ? 'book' : 'books'} picked)
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-stone-900">Harshest / most generous</h2>
          {raters.length === 0 ? (
            <p className="text-sm text-stone-500">Not enough data yet.</p>
          ) : (
            <ul className="space-y-1 text-sm text-stone-700">
              {raters.map((r) => (
                <li key={r.profile.id} className="flex items-center gap-2">
                  <Avatar name={r.profile.display_name} url={r.profile.avatar_url} size={6} />
                  {r.profile.display_name}: {r.averageRating.toFixed(1)}/10 avg (
                  {r.ratingCount} {r.ratingCount === 1 ? 'rating' : 'ratings'})
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-stone-900">Biggest disagreements</h2>
          {disagreements.length === 0 ? (
            <p className="text-sm text-stone-500">Not enough data yet.</p>
          ) : (
            <ul className="space-y-1 text-sm text-stone-700">
              {disagreements.slice(0, 5).map((d) => (
                <li key={d.book.id}>
                  {d.book.title}: spread of {d.spread} points
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-stone-900">Genres read</h2>
          {genres.length === 0 ? (
            <p className="text-sm text-stone-500">Not enough data yet.</p>
          ) : (
            <ul className="space-y-1 text-sm text-stone-700">
              {genres.map((g) => (
                <li key={g.genre}>
                  {g.genre}: {g.count}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section>
        <h2 className="mb-2 text-lg font-bold text-stone-900">Quote wall</h2>
        {quotesWithContext.length === 0 ? (
          <p className="text-sm text-stone-500">No quotes saved yet.</p>
        ) : (
          <ul className="space-y-2">
            {quotesWithContext.map((q) => (
              <li key={q.id} className="rounded-lg border border-stone-200 bg-white p-3 text-sm">
                <p className="italic text-stone-800">&ldquo;{q.quote_text}&rdquo;</p>
                <p className="mt-1 text-xs text-stone-500">
                  — {q.authorName}, from <span className="font-medium">{q.bookTitle}</span>
                  {q.page_number ? ` (p. ${q.page_number})` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
