function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.trim().slice(0, 2).toUpperCase()
}

// Stable pastel per person so initials-only avatars are still tell-apart-able.
const COLORS = [
  'bg-amber-100 text-amber-800',
  'bg-emerald-100 text-emerald-800',
  'bg-sky-100 text-sky-800',
  'bg-rose-100 text-rose-800',
  'bg-violet-100 text-violet-800',
  'bg-lime-100 text-lime-800',
]

function colorFor(name: string): string {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return COLORS[hash % COLORS.length]
}

export default function Avatar({
  name,
  url,
  size = 8,
  tooltip,
  showTooltip = true,
}: {
  name: string
  url?: string | null
  /** Tailwind spacing units (8 = 2rem = 32px). */
  size?: number
  tooltip?: string
  showTooltip?: boolean
}) {
  const dimension = size * 4
  const style = { width: dimension, height: dimension, fontSize: Math.max(9, dimension * 0.38) }

  return (
    <span className="group/avatar relative inline-flex shrink-0 hover:z-10">
      {url ? (
        <span
          className="inline-flex overflow-hidden rounded-full bg-stone-100 ring-2 ring-ink"
          style={style}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={name}
            width={dimension}
            height={dimension}
            className="h-full w-full object-cover"
            decoding="async"
          />
        </span>
      ) : (
        <span
          className={`inline-flex items-center justify-center rounded-full font-semibold ring-2 ring-ink ${colorFor(name)}`}
          style={style}
          aria-label={name}
        >
          {initials(name)}
        </span>
      )}
      {showTooltip && (
        <span className="tooltip bottom-full left-1/2 mb-1.5 -translate-x-1/2 group-hover/avatar:opacity-100">
          {tooltip ?? name}
        </span>
      )}
    </span>
  )
}
