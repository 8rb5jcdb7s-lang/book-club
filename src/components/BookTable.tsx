import Image from 'next/image'
import Link from 'next/link'
import Avatar from '@/components/Avatar'
import { daysTaken, historicalPace } from '@/lib/pace'
import type { Book } from '@/lib/types'

export type BookRow = Book & {
  picker?: { display_name: string; avatar_url: string | null } | null
}

// Interpolates from red (low score) to green (high score) on a 1-10 scale.
function scoreColor(rating: number): string {
  const clamped = Math.max(1, Math.min(10, rating))
  const fraction = (clamped - 1) / 9
  const hue = fraction * 120 // 0 = red, 120 = green
  return `hsl(${hue}, 70%, 85%)`
}

export default function BookTable({
  books,
  averageRatings,
}: {
  books: BookRow[]
  averageRatings?: Map<string, number>
}) {
  if (books.length === 0) {
    return <p className="text-sm text-stone-500">No books here yet.</p>
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-stone-200 text-sm">
        <thead className="bg-stone-50 text-left text-xs font-bold uppercase tracking-wide text-stone-500">
          <tr>
            <th className="px-4 py-3"></th>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Author</th>
            <th className="px-4 py-3">Pages</th>
            <th className="px-4 py-3">Started</th>
            <th className="px-4 py-3">Finished</th>
            <th className="px-4 py-3">Days</th>
            <th className="px-4 py-3">Pace</th>
            <th className="px-4 py-3">Avg Score</th>
            <th className="px-4 py-3">Picked by</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {books.map((book) => {
            const days = daysTaken(book)
            const pace = historicalPace(book)
            const avgRating = averageRatings?.get(book.id)
            return (
              <tr key={book.id} className="transition-colors hover:bg-stone-50">
                <td className="px-3 py-2">
                  {book.cover_url ? (
                    <div className="flex h-32 w-[5.33rem] items-center justify-center rounded-md border-2 border-stone-300 bg-stone-100 shadow-sm">
                      <Image
                        src={book.cover_url}
                        alt={book.title}
                        width={80}
                        height={120}
                        className="h-full w-full object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="h-32 w-[5.33rem] rounded-md border-2 border-stone-300 bg-stone-100" />
                  )}
                </td>
                <td className="px-4 py-3 font-bold text-stone-900">
                  <Link href={`/books/${book.id}`} className="hover:underline">
                    {book.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-stone-600">{book.author ?? '—'}</td>
                <td className="px-4 py-3 text-stone-600">{book.page_count ?? '—'}</td>
                <td className="px-4 py-3 text-stone-600">{book.date_started ?? '—'}</td>
                <td className="px-4 py-3 text-stone-600">{book.date_finished ?? '—'}</td>
                <td className="px-4 py-3 text-stone-600">{days ?? '—'}</td>
                <td className="px-4 py-3 text-stone-600">
                  {pace ? `${pace.toFixed(1)} pg/day` : '—'}
                </td>
                <td className="px-4 py-3">
                  {avgRating !== undefined ? (
                    <div
                      className="flex aspect-square w-10 shrink-0 items-center justify-center rounded-full border-2 border-stone-900 text-sm font-bold text-stone-900"
                      style={{ backgroundColor: scoreColor(avgRating) }}
                    >
                      {avgRating.toFixed(1)}
                    </div>
                  ) : (
                    <span className="text-stone-600">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-stone-600">
                  {book.picker ? (
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={book.picker.display_name}
                        url={book.picker.avatar_url}
                        size={6}
                      />
                      {book.picker.display_name}
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
