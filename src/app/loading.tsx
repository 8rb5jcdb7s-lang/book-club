export default function Loading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading">
      <div className="h-9 w-48 rounded-lg bg-stone-200/70" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-64 rounded-2xl bg-stone-200/60 lg:col-span-2" />
        <div className="h-64 rounded-2xl bg-stone-200/60" />
      </div>
      <div className="h-40 rounded-2xl bg-stone-200/50" />
    </div>
  )
}
