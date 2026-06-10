import Link from 'next/link'
import Avatar from '@/components/Avatar'
import PickerOrderEditor from '@/components/PickerOrderEditor'
import type { Profile } from '@/lib/types'

export default function PickerRotationCard({
  memberOrder,
  currentIndex,
  profiles,
}: {
  memberOrder: string[]
  currentIndex: number
  profiles: Profile[]
}) {
  const profileMap = new Map(profiles.map((p) => [p.id, p]))
  const nextPickerId = memberOrder[currentIndex]
  const nextPicker = nextPickerId ? profileMap.get(nextPickerId) : null

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
        Picker rotation
      </p>
      {nextPicker ? (
        <div className="mt-1 flex items-center gap-2">
          <Avatar name={nextPicker.display_name} url={nextPicker.avatar_url} size={8} />
          <p className="text-lg font-semibold text-stone-900">
            {nextPicker.display_name}&apos;s turn to pick next
          </p>
        </div>
      ) : (
        <p className="mt-1 text-sm text-stone-600">
          Rotation order isn&apos;t set up yet.
        </p>
      )}

      {memberOrder.length > 0 && (
        <ol className="mt-3 flex flex-wrap gap-2 text-sm">
          {memberOrder.map((id, i) => {
            const profile = profileMap.get(id)
            return (
              <li
                key={id}
                className={`flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-3 ${
                  i === currentIndex
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                <Avatar name={profile?.display_name ?? '?'} url={profile?.avatar_url} size={6} />
                {profile?.display_name ?? 'Unknown'}
              </li>
            )
          })}
        </ol>
      )}

      <Link
        href="/books/new"
        className="mt-4 inline-block rounded-lg border-2 border-stone-300 px-4 py-2 text-sm font-bold text-stone-700 shadow-sm hover:bg-stone-50 hover:shadow-md active:scale-95 transition-all"
      >
        Set the next book
      </Link>

      <PickerOrderEditor memberOrder={memberOrder} profiles={profiles} />
    </div>
  )
}
