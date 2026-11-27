import Avatar from '@/components/Avatar'
import ScoreBadge from '@/components/ScoreBadge'
import type { RatingNote } from '@/lib/types'

type Row = RatingNote & {
  profile?: { display_name: string; avatar_url?: string | null } | null
}

export default function NotesList({
  ratingsNotes,
  currentUserId = null,
  hideSpoilers = false,
}: {
  ratingsNotes: Row[]
  currentUserId?: string | null
  /** Tuck other people's written thoughts away (the viewer is still reading). */
  hideSpoilers?: boolean
}) {
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
                <span className="chip bg-stone-200">
                  Did not finish
                </span>
              ) : (
                rn.rating !== null && <ScoreBadge rating={rn.rating} size="sm" decimals={0} />
              )}
            </div>
            {rn.notes &&
              (hideSpoilers && rn.user_id !== currentUserId ? (
                <details className="mt-3 text-sm">
                  <summary className="cursor-pointer font-bold text-stone-500 select-none hover:text-ink">
                    Thoughts hidden until you finish (tap to peek, may spoil)
                  </summary>
                  <p className="mt-2 leading-relaxed whitespace-pre-line text-stone-700">
                    {rn.notes}
                  </p>
                </details>
              ) : (
                <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-stone-700">
                  {rn.notes}
                </p>
              ))}
          </li>
        )
      })}
    </ul>
  )
}
