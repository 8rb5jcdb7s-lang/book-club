// HTML for the club's emails.
//
// Email clients (Gmail especially) ignore most modern CSS: no positioning, no
// web fonts, no box-shadow, no flexbox. So this is deliberately old-fashioned
// — tables, inline styles, percentage widths — arranged to look like the
// site's cartoon style anyway. This file has no imports so it can be rendered
// on its own for previews.

const INK = '#2b2520'
const PAPER = '#fbf6ec'
const SUN = '#fcd34d'
const MUTED = '#78716c'
const FONT = "'Nunito','Fredoka',ui-rounded,'Arial Rounded MT Bold','Trebuchet MS','Helvetica Neue',Arial,sans-serif"

export type EmailPerson = { name: string; avatarUrl: string | null }

export type FinishLineEmail = {
  headline: string
  paragraphs: string[]
  button: { href: string; label: string }
  book: { title: string; author: string | null; coverUrl: string | null }
  /** 'YYYY-MM-DD' */
  startDate: string | null
  targetDate: string | null
  today: string
  /** In the order they finished. */
  finishers: (EmailPerson & { finishedDate: string })[]
  stillReading: EmailPerson[]
}

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function utc(date: string): number {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

function daysBetween(from: string, to: string): number {
  return Math.round((utc(to) - utc(from)) / 86_400_000)
}

function shortDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' }).format(
    new Date(utc(date))
  )
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th']
const MEDALS = ['#fcd34d', '#d6d3d1', '#fdba74']
const PASTELS = ['#fde68a', '#bbf7d0', '#bae6fd', '#fecdd3', '#ddd6fe', '#d9f99d']

function initials(name: string): string {
  const parts = name.trim().split(/[\s._-]+/).filter(Boolean)
  const letters = parts.length >= 2 ? parts[0][0] + parts[1][0] : name.trim().slice(0, 2)
  return letters.toUpperCase()
}

function pastelFor(name: string): string {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return PASTELS[hash % PASTELS.length]
}

/** A round avatar: the member's photo, or their initials on a pastel. */
function avatar(person: EmailPerson, size: number): string {
  const common = `width:${size}px;height:${size}px;border-radius:50%;border:2px solid ${INK};`
  if (person.avatarUrl) {
    return `<img src="${esc(person.avatarUrl)}" width="${size}" height="${size}" alt="${esc(person.name)}" style="${common}display:block;object-fit:cover;background:#fff;">`
  }
  return `<span style="${common}display:block;line-height:${size}px;text-align:center;font:800 ${Math.round(size * 0.38)}px/${size}px ${FONT};color:${INK};background:${pastelFor(person.name)};">${esc(initials(person.name))}</span>`
}

/** The timeline: a flag for each finisher above a bar, with dates below. */
function timeline(d: FinishLineEmail): string {
  if (!d.startDate || !d.targetDate) return ''
  const total = Math.max(1, daysBetween(d.startDate, d.targetDate))
  const elapsed = Math.min(100, Math.max(0, (daysBetween(d.startDate, d.today) / total) * 100))
  const overdue = daysBetween(d.today, d.targetDate) < 0

  // Each flag sits at the right-hand end of a cell whose width is the gap
  // since the previous flag, which puts it at the right spot along the bar
  // without any CSS positioning.
  let previous = 0
  const flagCells = d.finishers
    .map((f) => {
      const at = Math.min(100, Math.max(6, (daysBetween(d.startDate!, f.finishedDate) / total) * 100))
      const width = Math.max(0, at - previous)
      previous = Math.max(previous, at)
      return `<td width="${width.toFixed(1)}%" align="right" valign="bottom" style="padding:0;">${avatar(f, 26)}</td>`
    })
    .join('')
  const flags = d.finishers.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:5px;"><tr>${flagCells}<td style="padding:0;">&nbsp;</td></tr></table>`
    : ''

  const mid = new Date(utc(d.startDate) + Math.round(total / 2) * 86_400_000).toISOString().slice(0, 10)

  return `${flags}
<div style="border:2px solid ${INK};border-radius:99px;background:#ffffff;height:12px;overflow:hidden;">
  <div style="width:${Math.max(3, elapsed).toFixed(1)}%;height:12px;background:${overdue ? '#fb7185' : '#fbbf24'};border-radius:99px;"></div>
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:5px;font:600 12px ${FONT};color:${MUTED};"><tr>
  <td align="left" width="33%">${shortDate(d.startDate)}</td>
  <td align="center" width="34%">${shortDate(mid)}</td>
  <td align="right" width="33%">${shortDate(d.targetDate)}</td>
</tr></table>`
}

function finishList(d: FinishLineEmail): string {
  const rows = d.finishers
    .map((f, i) => {
      const took = d.startDate ? Math.max(1, daysBetween(d.startDate, f.finishedDate)) : null
      return `<tr>
  <td width="48" style="padding:4px 0;"><span style="display:inline-block;min-width:34px;text-align:center;border:2px solid ${INK};border-radius:99px;padding:1px 4px;font:800 12px ${FONT};color:${INK};background:${MEDALS[i] ?? '#ffffff'};">${ORDINALS[i] ?? `${i + 1}th`}</span></td>
  <td width="34" style="padding:4px 0;">${avatar(f, 24)}</td>
  <td style="padding:4px 0;font:800 15px ${FONT};color:${INK};">${esc(f.name)}</td>
  <td align="right" style="padding:4px 0;font:600 12px ${FONT};color:${MUTED};white-space:nowrap;">${shortDate(f.finishedDate)}${took !== null ? ` · ${plural(took, 'day')}` : ''}</td>
</tr>`
    })
    .join('')

  const waiting = d.stillReading.length
    ? `<tr><td colspan="4" style="padding:8px 0 0;font:600 13px ${FONT};color:${MUTED};">${
        d.stillReading.length === 1
          ? `Everyone’s waiting on <b style="color:${INK};">${esc(d.stillReading[0].name)}</b>.`
          : `Still reading: <b style="color:${INK};">${d.stillReading.map((m) => esc(m.name)).join(', ')}</b>`
      }</td></tr>`
    : `<tr><td colspan="4" style="padding:8px 0 0;font:800 13px ${FONT};color:#047857;">Everyone’s finished.</td></tr>`

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}${waiting}</table>`
}

type EmailBook = { title: string; author: string | null; coverUrl: string | null }

/** The cream page, the white outlined card, and the footer around every email. */
function shell(inner: string): string {
  return `<div style="margin:0;padding:24px 12px;background:${PAPER};">
<table role="presentation" align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;">
<tr><td style="padding:0 6px 12px;font:800 13px ${FONT};letter-spacing:1px;text-transform:uppercase;color:${MUTED};">Book Club</td></tr>
<tr><td style="background:#ffffff;border:2px solid ${INK};border-bottom-width:6px;border-radius:24px;padding:24px 22px;">
${inner}
</td></tr>
<tr><td style="padding:14px 6px 0;font:600 12px ${FONT};color:${MUTED};">You can turn these emails off on your profile page.</td></tr>
</table>
</div>`
}

function intro(headline: string, paragraphs: string[]): string {
  return `<h1 style="margin:0 0 10px;font:800 26px/1.2 ${FONT};color:${INK};">${esc(headline)}</h1>
  ${paragraphs.map((p) => `<p style="margin:0 0 8px;font:600 16px/1.5 ${FONT};color:#44403c;">${esc(p)}</p>`).join('\n  ')}`
}

function buttonLink(button: { href: string; label: string }): string {
  return `<a href="${esc(button.href)}" style="display:inline-block;background:${SUN};color:${INK};text-decoration:none;border:2px solid ${INK};border-bottom-width:5px;border-radius:99px;padding:9px 22px;font:800 15px ${FONT};">${esc(button.label)}</a>`
}

/** The cover sticker beside the title, author and an optional yellow tag. */
function bookHeader(
  book: EmailBook,
  eyebrow: string,
  tag: { label: string; note?: string } | null
): string {
  const cover = book.coverUrl
    ? `<img src="${esc(book.coverUrl)}" width="84" alt="Cover of ${esc(book.title)}" style="display:block;width:84px;height:126px;object-fit:cover;border:2px solid ${INK};border-right-width:4px;border-bottom-width:5px;border-radius:10px;background:#ffffff;">`
    : ''
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      ${cover ? `<td width="100" valign="top" style="padding-right:14px;">${cover}</td>` : ''}
      <td valign="top">
        <div style="font:800 11px ${FONT};letter-spacing:1px;text-transform:uppercase;color:#b45309;">${esc(eyebrow)}</div>
        <div style="margin-top:2px;font:800 20px/1.2 ${FONT};color:${INK};">${esc(book.title)}</div>
        ${book.author ? `<div style="margin-top:2px;font:600 14px ${FONT};color:${MUTED};">by ${esc(book.author)}</div>` : ''}
        ${
          tag
            ? `<div style="margin-top:10px;"><span style="display:inline-block;border:2px solid ${INK};border-radius:99px;background:${SUN};padding:2px 10px;font:800 13px ${FONT};color:${INK};">${esc(tag.label)}</span>${
                tag.note ? `<span style="font:600 13px ${FONT};color:${MUTED};">&nbsp;${esc(tag.note)}</span>` : ''
              }</div>`
            : ''
        }
      </td>
    </tr></table>`
}

function panel(inner: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 18px;background:${PAPER};border:2px solid ${INK};border-radius:18px;">
  <tr><td style="padding:16px;">${inner}</td></tr></table>`
}

/** The "someone finished" email, with the finish-line card in it. */
export function renderFinishLineEmail(d: FinishLineEmail): string {
  const daysLeft = d.targetDate ? daysBetween(d.today, d.targetDate) : null
  const countdown =
    daysLeft === null
      ? null
      : daysLeft < 0
        ? `${plural(Math.abs(daysLeft), 'day')} over`
        : daysLeft === 0
          ? 'Due today'
          : `${plural(daysLeft, 'day')} left`

  return shell(`
  ${intro(d.headline, d.paragraphs)}
  ${panel(`
    ${bookHeader(
      d.book,
      'Now reading',
      countdown && d.targetDate ? { label: countdown, note: `finish by ${shortDate(d.targetDate)}` } : null
    )}
    <div style="margin-top:16px;">${timeline(d)}</div>
    <div style="margin-top:14px;border-top:2px dashed #d6d3d1;padding-top:10px;">
      <div style="font:800 11px ${FONT};letter-spacing:1px;text-transform:uppercase;color:${MUTED};margin-bottom:2px;">The finish line · ${d.finishers.length} of ${d.finishers.length + d.stillReading.length} finished</div>
      ${finishList(d)}
    </div>`)}
  ${buttonLink(d.button)}`)
}

export type BookEmail = {
  headline: string
  paragraphs: string[]
  button: { href: string; label: string }
  /** Shown as a card with its cover; omit for a text-only email. */
  book?: EmailBook
  eyebrow?: string
  tag?: { label: string; note?: string } | null
}

/** Every other club email: the same card style, with the book but no timeline. */
export function renderBookEmail(d: BookEmail): string {
  return shell(`
  ${intro(d.headline, d.paragraphs)}
  ${d.book ? panel(bookHeader(d.book, d.eyebrow ?? 'Book Club', d.tag ?? null)) : '<div style="height:10px;"></div>'}
  ${buttonLink(d.button)}`)
}
