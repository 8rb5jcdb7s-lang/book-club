// Interpolates from red (low score) to green (high score) on a 1-10 scale.
function scoreColors(rating: number): { background: string; color: string } {
  const clamped = Math.max(1, Math.min(10, rating))
  const hue = ((clamped - 1) / 9) * 120 // 0 = red, 120 = green
  return { background: `hsl(${hue}, 75%, 88%)`, color: `hsl(${hue}, 60%, 22%)` }
}

export default function ScoreBadge({
  rating,
  size = 'md',
  decimals = 1,
  breakdown,
}: {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  decimals?: number
  /** Individual ratings shown in a tooltip on hover. */
  breakdown?: { name: string; rating: number }[]
}) {
  const sizes = {
    sm: 'h-7 min-w-7 px-1.5 text-xs',
    md: 'h-10 min-w-10 px-2 text-sm',
    lg: 'h-16 min-w-16 px-3 text-2xl',
  }

  return (
    <span className="group/score relative inline-flex">
      <span
        className={`inline-flex items-center justify-center rounded-full font-bold tabular-nums ${sizes[size]}`}
        style={scoreColors(rating)}
      >
        {/* Whole scores show as "7"; half points always keep their ".5". */}
        {rating.toFixed(decimals === 0 && !Number.isInteger(rating) ? 1 : decimals)}
      </span>
      {breakdown && breakdown.length > 0 && (
        <span className="tooltip bottom-full left-1/2 mb-1.5 flex -translate-x-1/2 flex-col gap-0.5 group-hover/score:opacity-100">
          {breakdown.map((r, i) => (
            <span key={i} className="flex justify-between gap-3">
              <span>{r.name}</span>
              <span className="tabular-nums">{r.rating}/10</span>
            </span>
          ))}
        </span>
      )}
    </span>
  )
}
