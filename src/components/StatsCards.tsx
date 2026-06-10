export default function StatsCards({
  items,
}: {
  items: { label: string; value: string }[]
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-stone-200 bg-white p-5 text-center shadow-sm transition-transform hover:scale-105"
        >
          <p className="text-3xl font-bold text-stone-900">{item.value}</p>
          <p className="mt-1 text-sm font-semibold text-stone-500">{item.label}</p>
        </div>
      ))}
    </div>
  )
}
