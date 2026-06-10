import Link from 'next/link'
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
  const profileMap = new Map(profiles.map((p) => [p.id, p.display_name]))
  const nextPickerId = memberOrder[currentIndex]
  const nextPickerName = nextPickerId ? profileMap.get(nextPickerId) : null

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
        Picker rotation
      </p>
      {nextPickerName ? (
        <p className="mt-1 text-lg font-semibold text-stone-900">
          {nextPickerName}&apos;s turn to pick next
        </p>
      ) : (
        <p className="mt-1 text-sm text-stone-600">
          Rotation order isn&apos;t set up yet.
        </p>
      )}

      {memberOrder.length > 0 && (
        <ol className="mt-3 flex flex-wrap gap-2 text-sm">
          {memberOrder.map((id, i) => (
            <li
              key={id}
              className={`rounded-full px-3 py-1 ${
                i === currentIndex
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              {profileMap.get(id) ?? 'Unknown'}
            </li>
          ))}
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
