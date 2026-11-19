// Dates are stored as plain 'YYYY-MM-DD' strings. `new Date('2026-05-01')`
// parses those as UTC midnight, which shows up as the previous day in US time
// zones, so everything here treats them as calendar dates instead.

// The server (Vercel) runs in UTC; "today" should mean today for the club.
export const CLUB_TIME_ZONE =
  process.env.NEXT_PUBLIC_CLUB_TIME_ZONE ?? 'America/Los_Angeles'

const MS_PER_DAY = 1000 * 60 * 60 * 24

/** Today's date as 'YYYY-MM-DD' in the club's time zone. */
export function todayStr(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CLUB_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

function toUtcMs(dateStr: string): number {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number)
  return Date.UTC(y, (m ?? 1) - 1, d ?? 1)
}

/** Whole calendar days from `start` to `end` (negative if end is earlier). */
export function daysBetween(start: string, end: string): number {
  return Math.round((toUtcMs(end) - toUtcMs(start)) / MS_PER_DAY)
}

/** 'May 1, 2026' (or 'May 1' when `withYear` is false). */
export function formatDate(
  dateStr: string | null | undefined,
  { withYear = true }: { withYear?: boolean } = {}
): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}),
  }).format(new Date(toUtcMs(dateStr)))
}

/** Calendar year of a 'YYYY-MM-DD' string. */
export function yearOf(dateStr: string): number {
  return Number(dateStr.slice(0, 4))
}
