import Avatar from '@/components/Avatar'
import ScoreBadge from '@/components/ScoreBadge'
import type { RatingNote } from '@/lib/types'

type Row = RatingNote & {
  profile?: { display_name: string; avatar_url?: string | null } | null
}

export default function NotesList({ ratingsNotes }: { ratingsNotes: Row[] }) {
  if (ratingsNotes.length === 0) {
    return <p className="empty-state">No ratings or notes yet. Be the first!</p>
  }

  return (
    <ul className="space-y-3">
      {ratingsNotes.map((rn) => {
        const name = rn.profile?.display_name ?? 'Unknown'
        return (
          <li key={rn.id} className="card p-4">
            <div className="flex items-center gap-3">
              <Avatar name={name} url={rn.profile?.avatar_url} size={8} showTooltip={false} />
              <span className="flex-1 font-medium text-stone-900">{name}</span>
              {rn.did_not_finish ? (
                <span className="rounded-full bg-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-600">
                  Did not finish
                </span>
              ) : (
                rn.rating !== null && <ScoreBadge rating={rn.rating} size="sm" decimals={0} />
              )}
            </div>
            {rn.notes && (
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-stone-700">
                {rn.notes}
              </p>
            )}
          </li>
        )
      })}
    </ul>
  )
}
