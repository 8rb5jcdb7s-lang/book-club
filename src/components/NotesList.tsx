import type { RatingNote } from '@/lib/types'

type Row = RatingNote & { profile?: { display_name: string } | null }

export default function NotesList({ ratingsNotes }: { ratingsNotes: Row[] }) {
  if (ratingsNotes.length === 0) {
    return <p className="text-sm text-stone-500">No ratings or notes yet.</p>
  }

  return (
    <ul className="space-y-3">
      {ratingsNotes.map((rn) => (
        <li key={rn.id} className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-stone-900">
              {rn.profile?.display_name ?? 'Unknown'}
            </span>
            {rn.rating !== null && (
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700">
                {rn.rating}/10
              </span>
            )}
          </div>
          {rn.notes && <p className="mt-2 text-sm text-stone-600">{rn.notes}</p>}
        </li>
      ))}
    </ul>
  )
}
