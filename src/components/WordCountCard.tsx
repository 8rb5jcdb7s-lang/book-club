import { WORD_REFERENCES, formatWordComparison } from '@/lib/wordCount'

export default function WordCountCard({ totalWords }: { totalWords: number }) {
  const year = new Date().getFullYear()

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-stone-500">Words read in {year}</p>
      <p className="mt-1 text-4xl font-bold text-stone-900">{totalWords.toLocaleString()}</p>
      <p className="mt-1 text-xs text-stone-400">
        Estimated from page counts (~275 words/page)
      </p>

      <ul className="mt-4 space-y-1.5 text-sm text-stone-700">
        {WORD_REFERENCES.map((ref) => (
          <li key={ref.label} className="flex items-baseline gap-1.5">
            <span className="font-bold text-stone-900">
              {formatWordComparison(totalWords, ref)}
            </span>
            {ref.note && <span className="text-xs text-stone-400">({ref.note})</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
