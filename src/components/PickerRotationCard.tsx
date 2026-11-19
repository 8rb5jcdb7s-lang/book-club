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
  const order = memberOrder.filter((id) => profileMap.has(id))
  const nextPicker = profileMap.get(memberOrder[currentIndex] ?? '') ?? null

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Next pick</p>
          {nextPicker ? (
            <div className="mt-2 flex items-center gap-3">
              <Avatar
                name={nextPicker.display_name}
                url={nextPicker.avatar_url}
                size={11}
                showTooltip={false}
              />
              <h2 className="text-2xl font-semibold text-stone-900">
                {nextPicker.display_name}&apos;s turn
              </h2>
            </div>
          ) : (
            <p className="mt-2 text-sm text-stone-600">
              The pick order isn&apos;t set up yet — use “Edit order” to add everyone.
            </p>
          )}
        </div>
        <Link href="/books/new" className="btn btn-secondary">
          Add the next book
        </Link>
      </div>

      {order.length > 0 && (
        <ol className="mt-5 flex flex-wrap items-center gap-x-1 gap-y-2 text-sm">
          {order.map((id, i) => {
            const profile = profileMap.get(id)!
            const isNext = id === memberOrder[currentIndex]
            return (
              <li key={id} className="flex items-center gap-1">
                {i > 0 && (
                  <span className="px-0.5 text-stone-300" aria-hidden="true">
                    →
                  </span>
                )}
                <span
                  className={`flex items-center gap-1.5 rounded-full py-1 pr-3 pl-1 font-medium ${
                    isNext ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  <Avatar
                    name={profile.display_name}
                    url={profile.avatar_url}
                    size={6}
                    showTooltip={false}
                  />
                  {profile.display_name}
                </span>
              </li>
            )
          })}
        </ol>
      )}

      <div className="mt-3 flex flex-wrap">
        <PickerOrderEditor
          memberOrder={memberOrder}
          currentIndex={currentIndex}
          profiles={profiles}
        />
      </div>
    </div>
  )
}
