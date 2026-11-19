import { WORD_REFERENCES, formatWordComparison } from '@/lib/wordCount'

export default function WordCountCard({ totalWords, year }: { totalWords: number; year: number }) {
  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
        <div>
          <p className="eyebrow">Words read in {year}</p>
          <p className="mt-1 font-serif text-5xl font-semibold text-stone-900 tabular-nums">
            {totalWords.toLocaleString()}
          </p>
        </div>
        <p className="text-xs text-stone-400">Estimated at ~275 words per page</p>
      </div>

      <ul className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {WORD_REFERENCES.map((ref) => {
          const fraction = Math.min(1, totalWords / ref.words)
          return (
            <li key={ref.label}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-semibold text-stone-900">
                  {formatWordComparison(totalWords, ref)}
                </span>
                {ref.note && <span className="text-xs text-stone-400">{ref.note}</span>}
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-stone-100">
                <div
                  className={`h-full rounded-full ${fraction >= 1 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.max(2, fraction * 100)}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
