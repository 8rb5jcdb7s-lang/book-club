import { createAdminClient } from '@/lib/supabase/admin'
import { emailConfigured, sendEmail } from '@/lib/email'
import { daysBetween, formatDate, todayStr } from '@/lib/dates'
import {
  renderBookEmail,
  renderFinishLineEmail,
  type FinishLineEmail,
} from '@/lib/emailTemplates'

// The club only gets three kinds of email, each at most once per book (and
// per person where it's about a person):
//   1. a new book was started
//   2. someone finished the current book
//   3. you're the only one who hasn't rated a finished book, and have been
//      for a couple of days (checked by the daily cron, not on the spot)

type Admin = NonNullable<ReturnType<typeof createAdminClient>>
type Member = {
  id: string
  name: string
  email: string
  wantsEmail: boolean
  avatarUrl: string | null
}

/**
 * On the live site, do nothing at all until Gmail is set up — otherwise an
 * email would be logged as sent without ever going out. (In development the
 * emails are printed to the server log instead, so the flow can be tested.)
 */
function canNotify(): boolean {
  return emailConfigured() || process.env.NODE_ENV !== 'production'
}

function pick<T>(options: T[]): T {
  return options[Math.floor(Math.random() * options.length)]
}

/** The plain-text version that goes alongside every HTML email. */
function plainText(title: string, paragraphs: string[], link: { href: string; label: string }): string {
  return [
    title,
    '',
    ...paragraphs,
    '',
    `${link.label}: ${link.href}`,
    '',
    '—',
    'Book Club. Turn these emails off on your profile page.',
  ].join('\n')
}

type BookRow = {
  id: string
  title: string
  author: string | null
  cover_url: string | null
  date_started: string | null
  target_finish_date: string | null
}

/** Everything the finish-line card shows, apart from the words above it. */
function finishLineData(
  book: BookRow,
  members: Member[],
  finishes: { user_id: string; finished_at: string }[]
): Pick<FinishLineEmail, 'book' | 'startDate' | 'targetDate' | 'today' | 'finishers' | 'stillReading'> {
  const ordered = [...finishes].sort((a, b) => a.finished_at.localeCompare(b.finished_at))
  const finishers = ordered.flatMap((f) => {
    const member = members.find((m) => m.id === f.user_id)
    return member
      ? [
          {
            name: member.name,
            avatarUrl: member.avatarUrl,
            finishedDate: todayStr(new Date(f.finished_at)),
          },
        ]
      : []
  })
  const finishedIds = new Set(ordered.map((f) => f.user_id))
  return {
    book: { title: book.title, author: book.author, coverUrl: book.cover_url },
    startDate: book.date_started,
    targetDate: book.target_finish_date,
    today: todayStr(),
    finishers,
    stillReading: members
      .filter((m) => !finishedIds.has(m.id))
      .map((m) => ({ name: m.name, avatarUrl: m.avatarUrl })),
  }
}

/**
 * The finish-line email for whichever book the club is reading (or, failing
 * that, the one it finished most recently) — used by the "send me a test
 * email" button so the real layout can be checked in a real inbox.
 */
export async function renderSampleEmail(siteUrl: string): Promise<{ text: string; html: string }> {
  const headline = 'This is a Book Club test email'
  const paragraphs = [
    'It works. This is what you get when someone presses “I finished it!” — the finish line as it stands right now.',
  ]
  const button = { href: siteUrl, label: 'Open Book Club' }
  const text = plainText(headline, paragraphs, button)

  const admin = createAdminClient()
  if (admin) {
    const { data: books } = await admin
      .from('books')
      .select('*')
      .in('status', ['reading', 'finished'])
      .order('date_started', { ascending: false, nullsFirst: false })
      .limit(10)
    const book = (books ?? []).find((b) => b.status === 'reading') ?? (books ?? [])[0]
    if (book) {
      const [members, { data: finishes }] = await Promise.all([
        loadMembers(admin),
        admin.from('book_finishes').select('user_id, finished_at').eq('book_id', book.id),
      ])
      return {
        text,
        html: renderFinishLineEmail({
          headline,
          paragraphs,
          button,
          ...finishLineData(book as BookRow, members, finishes ?? []),
        }),
      }
    }
  }
  return { text, html: renderBookEmail({ headline, paragraphs, button }) }
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
      avatarUrl: (p.avatar_url as string | null) ?? null,
    }))
    .filter((m) => m.email)
}

/**
 * Records that an email is about to go out. Returns false if it was already
 * sent, or if the log table isn't there yet — without the log there's no way
 * to prevent repeats, so nothing is sent until the migration has been run.
 */
async function claim(
  admin: Admin,
  kind: string,
  bookId: string,
  subjectKey = ''
): Promise<string | null> {
  const { data, error } = await admin
    .from('email_log')
    .insert({ kind, book_id: bookId, subject_key: subjectKey })
    .select('id')
    .single()
  if (!error && data) return data.id as string
  if (error && error.code !== '23505') {
    console.warn(`[notifications] not sending "${kind}": ${error.message}`)
  }
  return null
}

/**
 * Sends one email per recipient and writes the result back to the log row,
 * so a failed send shows up on the profile page rather than vanishing.
 */
async function sendToAll(
  admin: Admin,
  logId: string,
  recipients: Member[],
  build: (member: Member) => { subject: string; text: string; html: string }
) {
  const results = await Promise.allSettled(
    recipients
      .filter((m) => m.wantsEmail)
      .map((m) => sendEmail({ to: m.email, ...build(m) }))
  )

  const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
  const reason = failures[0]
    ? String(failures[0].reason instanceof Error ? failures[0].reason.message : failures[0].reason)
    : null
  if (failures.length > 0) {
    console.error(`[notifications] ${failures.length} of ${results.length} emails failed: ${reason}`)
  }

  // These columns come from a later migration; if it hasn't been run the
  // update fails harmlessly and the email has still gone out.
  const { error } = await admin
    .from('email_log')
    .update({
      sent_count: results.length - failures.length,
      failed_count: failures.length,
      error: reason ? reason.slice(0, 300) : null,
    })
    .eq('id', logId)
  if (error) console.warn(`[notifications] couldn't record the outcome: ${error.message}`)
}

/** Email 1: the club has a new book. Goes to everyone except whoever started it. */
export async function notifyBookStarted(bookId: string, actorId: string | null, siteUrl: string) {
  if (!canNotify()) return
  const admin = createAdminClient()
  if (!admin) return

  const { data: book } = await admin.from('books').select('*').eq('id', bookId).maybeSingle()
  if (!book || book.status !== 'reading') return
  const logId = await claim(admin, 'book_started', bookId)
  if (!logId) return

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

  const headline = `Next up: ${book.title}`
  const button = { href: siteUrl, label: 'Open Book Club' }
  const html = renderBookEmail({
    headline,
    paragraphs,
    button,
    book: { title: book.title, author: book.author, coverUrl: book.cover_url },
    eyebrow: 'New book',
    tag: book.target_finish_date
      ? { label: `Finish by ${formatDate(book.target_finish_date, { withYear: false })}` }
      : picker
        ? { label: `Picked by ${picker.name}` }
        : null,
  })

  await sendToAll(
    admin,
    logId,
    members.filter((m) => m.id !== actorId),
    () => ({ subject: `New book: ${book.title}`, text: plainText(headline, paragraphs, button), html })
  )
}

/** Email 2: someone finished the current book. Goes to everyone, finisher included. */
export async function notifyFinished(bookId: string, finisherId: string, siteUrl: string) {
  if (!canNotify()) return
  const admin = createAdminClient()
  if (!admin) return

  const [{ data: book }, { data: finishes }] = await Promise.all([
    admin.from('books').select('*').eq('id', bookId).maybeSingle(),
    admin.from('book_finishes').select('user_id, finished_at').eq('book_id', bookId),
  ])
  if (!book) return
  // Un-clicking and re-clicking the button must not email everyone again.
  const logId = await claim(admin, 'finished', bookId, finisherId)
  if (!logId) return

  const members = await loadMembers(admin)
  const finisher = members.find((m) => m.id === finisherId)
  if (!finisher) return

  // The finish that triggered this may not be in the query result yet.
  const allFinishes = (finishes ?? []).some((f) => f.user_id === finisherId)
    ? (finishes ?? [])
    : [...(finishes ?? []), { user_id: finisherId, finished_at: new Date().toISOString() }]
  const finishedIds = new Set(allFinishes.map((f) => f.user_id as string))
  const card = finishLineData(book as BookRow, members, allFinishes)
  const stillReading = members.filter((m) => !finishedIds.has(m.id))
  const place = finishedIds.size

  await sendToAll(
    admin,
    logId,
    // Everyone, including the finisher — theirs is a confirmation that the
    // rest of the club has been told.
    members,
    (member) => {
      if (member.id === finisherId) {
        const subject = `You finished ${book.title}`
        const paragraphs = [
          place === 1
            ? `You're the first to finish “${book.title}”. Bragging rights secured.`
            : `You've finished “${book.title}” — number ${place} of ${members.length} across the line.`,
          stillReading.length > 0
            ? `Everyone else has been told. Still reading: ${stillReading.map((m) => m.name).join(', ')}.`
            : 'That’s everyone. Time to pick a date to talk about it.',
        ]
        const button = { href: siteUrl, label: 'See the finish line' }
        return {
          subject,
          text: plainText(subject, paragraphs, button),
          html: renderFinishLineEmail({ headline: subject, paragraphs, button, ...card }),
        }
      }

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
      const button = { href: siteUrl, label: isReading ? 'I finished it too' : 'See the finish line' }
      return {
        subject,
        text: plainText(subject, paragraphs, button),
        html: renderFinishLineEmail({ headline: subject, paragraphs, button, ...card }),
      }
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
    const logId = await claim(admin, 'last_to_rate', book.id, straggler.id)
    if (!logId) continue
    nudged.add(straggler.id)

    const paragraphs = [
      `Everyone else has rated “${book.title}”. You're the only one who hasn't, ${straggler.name}.`,
      'It takes ten seconds: a score out of 10, or tick “I didn’t finish this one” and own it.',
    ]
    const subject = `You're the only one who hasn't rated ${book.title}`
    const button = { href: `${siteUrl}/books/${book.id}`, label: 'Rate it now' }
    const html = renderBookEmail({
      headline: subject,
      paragraphs,
      button,
      book: { title: book.title, author: book.author, coverUrl: book.cover_url },
      eyebrow: 'Waiting on your rating',
      tag: { label: `${members.length - 1} of ${members.length} have rated` },
    })
    await sendToAll(admin, logId, [straggler], () => ({
      subject,
      text: plainText(subject, paragraphs, button),
      html,
    }))
    sent += 1
  }

  return sent
}
