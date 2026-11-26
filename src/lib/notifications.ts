import { createAdminClient } from '@/lib/supabase/admin'
import { emailConfigured, sendEmail } from '@/lib/email'
import { daysBetween, formatDate, todayStr } from '@/lib/dates'

// The club only gets three kinds of email, each at most once per book (and
// per person where it's about a person):
//   1. a new book was started
//   2. someone finished the current book
//   3. you're the only one who hasn't rated a finished book, and have been
//      for a couple of days (checked by the daily cron, not on the spot)

type Admin = NonNullable<ReturnType<typeof createAdminClient>>
type Member = { id: string; name: string; email: string; wantsEmail: boolean }

/**
 * On the live site, do nothing at all until Gmail is set up — otherwise an
 * email would be logged as sent without ever going out. (In development the
 * emails are printed to the server log instead, so the flow can be tested.)
 */
function canNotify(): boolean {
  return emailConfigured() || process.env.NODE_ENV !== 'production'
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function pick<T>(options: T[]): T {
  return options[Math.floor(Math.random() * options.length)]
}

function layout(title: string, paragraphs: string[], link: { href: string; label: string }) {
  const text = [title, '', ...paragraphs, '', `${link.label}: ${link.href}`, '', '—', 'Book Club. Turn these emails off on your profile page.'].join('\n')
  const html = `<div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:24px;color:#1c1917">
  <h1 style="font-size:22px;margin:0 0 12px">${escapeHtml(title)}</h1>
  ${paragraphs.map((p) => `<p style="font-size:16px;line-height:1.5;margin:0 0 12px">${escapeHtml(p)}</p>`).join('\n  ')}
  <p style="margin:20px 0"><a href="${escapeHtml(link.href)}" style="background:#1c1917;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-family:Arial,sans-serif;font-size:14px;font-weight:bold">${escapeHtml(link.label)}</a></p>
  <p style="font-family:Arial,sans-serif;font-size:12px;color:#78716c;margin:24px 0 0">Book Club · You can turn these emails off on your profile page.</p>
</div>`
  return { text, html }
}

async function loadMembers(admin: Admin): Promise<Member[]> {
  const [{ data: profiles }, { data: users }] = await Promise.all([
    admin.from('profiles').select('*'),
    admin.auth.admin.listUsers({ perPage: 200 }),
  ])
  const emails = new Map((users?.users ?? []).map((u) => [u.id, u.email ?? '']))

  return (profiles ?? [])
    .map((p) => ({
      id: p.id as string,
      name: p.display_name as string,
      email: emails.get(p.id) ?? '',
      // The column comes from a migration; before it exists, everyone is in.
      wantsEmail: p.email_notifications !== false,
    }))
    .filter((m) => m.email)
}

/**
 * Records that an email is about to go out. Returns false if it was already
 * sent, or if the log table isn't there yet — without the log there's no way
 * to prevent repeats, so nothing is sent until the migration has been run.
 */
async function claim(admin: Admin, kind: string, bookId: string, subjectKey = ''): Promise<boolean> {
  const { error } = await admin
    .from('email_log')
    .insert({ kind, book_id: bookId, subject_key: subjectKey })
  if (!error) return true
  if (error.code !== '23505') {
    console.warn(`[notifications] not sending "${kind}": ${error.message}`)
  }
  return false
}

async function sendToAll(recipients: Member[], build: (member: Member) => { subject: string; text: string; html: string }) {
  await Promise.allSettled(
    recipients
      .filter((m) => m.wantsEmail)
      .map((m) => sendEmail({ to: m.email, ...build(m) }))
  )
}

/** Email 1: the club has a new book. Goes to everyone except whoever started it. */
export async function notifyBookStarted(bookId: string, actorId: string | null, siteUrl: string) {
  if (!canNotify()) return
  const admin = createAdminClient()
  if (!admin) return

  const { data: book } = await admin.from('books').select('*').eq('id', bookId).maybeSingle()
  if (!book || book.status !== 'reading') return
  if (!(await claim(admin, 'book_started', bookId))) return

  const members = await loadMembers(admin)
  const picker = members.find((m) => m.id === book.picked_by)

  const details = [
    book.author ? `by ${book.author}` : null,
    book.page_count ? `${book.page_count} pages` : null,
    picker ? `picked by ${picker.name}` : null,
  ].filter(Boolean).join(' · ')

  const paragraphs = [
    `The club's next book is “${book.title}”${details ? ` (${details})` : ''}.`,
    book.target_finish_date
      ? `The goal is to finish by ${formatDate(book.target_finish_date)}${
          book.page_count ? ' — the site shows what page you should be on each day' : ''
        }.`
      : 'No finish date has been set yet.',
    'When you finish, hit “I finished it!” on the site so everyone else feels the pressure.',
  ]

  await sendToAll(
    members.filter((m) => m.id !== actorId),
    () => ({ subject: `New book: ${book.title}`, ...layout(`Next up: ${book.title}`, paragraphs, { href: siteUrl, label: 'Open Book Club' }) })
  )
}

/** Email 2: someone finished the current book. Goes to everyone else. */
export async function notifyFinished(bookId: string, finisherId: string, siteUrl: string) {
  if (!canNotify()) return
  const admin = createAdminClient()
  if (!admin) return

  const [{ data: book }, { data: finishes }] = await Promise.all([
    admin.from('books').select('*').eq('id', bookId).maybeSingle(),
    admin.from('book_finishes').select('user_id').eq('book_id', bookId),
  ])
  if (!book) return
  // Un-clicking and re-clicking the button must not email everyone again.
  if (!(await claim(admin, 'finished', bookId, finisherId))) return

  const members = await loadMembers(admin)
  const finisher = members.find((m) => m.id === finisherId)
  if (!finisher) return

  const finishedIds = new Set((finishes ?? []).map((f) => f.user_id as string))
  finishedIds.add(finisherId)
  const stillReading = members.filter((m) => !finishedIds.has(m.id))
  const place = finishedIds.size

  await sendToAll(
    members.filter((m) => m.id !== finisherId),
    (member) => {
      const isReading = stillReading.some((m) => m.id === member.id)
      const lastOneLeft = isReading && stillReading.length === 1

      const paragraphs: string[] = []
      if (place === 1) {
        paragraphs.push(`${finisher.name} is the first to finish “${book.title}”.`)
      } else {
        paragraphs.push(`${finisher.name} has finished “${book.title}” — that's ${place} of ${members.length} done.`)
      }

      if (lastOneLeft) {
        paragraphs.push(
          pick([
            `That makes you the only one still reading, ${member.name}. Everyone is waiting. No pressure.`,
            `${member.name}, you are now officially the last one. The discussion can't start without you.`,
            `Everyone else is done, ${member.name}. The book isn't going to read itself.`,
          ])
        )
      } else if (isReading) {
        paragraphs.push(
          pick([
            'You, on the other hand, have not. Time to pick up the pace.',
            'Where are you at? The finish line is getting crowded.',
            `Don't be the last one in. Still reading: ${stillReading.map((m) => m.name).join(', ')}.`,
          ])
        )
      } else {
        paragraphs.push(
          stillReading.length > 0
            ? `Still reading: ${stillReading.map((m) => m.name).join(', ')}. Feel free to heckle.`
            : 'That’s everyone. Time to pick a date to talk about it.'
        )
      }

      const subject = lastOneLeft
        ? `You're the last one reading ${book.title}`
        : `${finisher.name} finished ${book.title}`
      return { subject, ...layout(subject, paragraphs, { href: siteUrl, label: isReading ? 'I finished it too' : 'See the finish line' }) }
    }
  )
}

// How long everyone else has to have been done before the straggler is
// nudged, and how far back to look for books worth nudging about.
const NUDGE_AFTER_DAYS = 2
const NUDGE_WINDOW_DAYS = 45

/**
 * Email 3: on a recently finished book, when exactly one member still hasn't
 * rated it (or marked it "did not finish") and everyone else has been done
 * for a couple of days, nudge that one person. Once per book; run daily.
 */
export async function notifyLastToRate(siteUrl: string): Promise<number> {
  if (!canNotify()) return 0
  const admin = createAdminClient()
  if (!admin) return 0

  const today = todayStr()
  const [{ data: books }, { data: ratings }, members] = await Promise.all([
    admin.from('books').select('*').eq('status', 'finished'),
    admin.from('ratings_notes').select('*'),
    loadMembers(admin),
  ])
  if (members.length < 3) return 0

  const cutoff = Date.now() - NUDGE_AFTER_DAYS * 24 * 60 * 60 * 1000
  const nudged = new Set<string>()
  let sent = 0

  for (const book of books ?? []) {
    // Skip old books so nobody gets a pile of emails about last year.
    if (!book.date_finished || daysBetween(book.date_finished, today) > NUDGE_WINDOW_DAYS) continue

    const responses = (ratings ?? []).filter(
      (r) => r.book_id === book.id && (r.rating !== null || r.did_not_finish)
    )
    const responded = new Set(responses.map((r) => r.user_id as string))
    const missing = members.filter((m) => !responded.has(m.id))
    if (missing.length !== 1) continue

    // Everyone else must have been done for a couple of days — not five
    // minutes ago, while the last person is still typing.
    const latest = Math.max(...responses.map((r) => new Date(r.created_at as string).getTime()))
    if (!(latest <= cutoff)) continue

    const straggler = missing[0]
    // At most one nudge per person per day.
    if (nudged.has(straggler.id) || !straggler.wantsEmail) continue
    if (!(await claim(admin, 'last_to_rate', book.id, straggler.id))) continue
    nudged.add(straggler.id)

    const paragraphs = [
      `Everyone else has rated “${book.title}”. You're the only one who hasn't, ${straggler.name}.`,
      'It takes ten seconds: a score out of 10, or tick “I didn’t finish this one” and own it.',
    ]
    const subject = `You're the only one who hasn't rated ${book.title}`
    await sendToAll([straggler], () => ({
      subject,
      ...layout(subject, paragraphs, { href: `${siteUrl}/books/${book.id}`, label: 'Rate it now' }),
    }))
    sent += 1
  }

  return sent
}
