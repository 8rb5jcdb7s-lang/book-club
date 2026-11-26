'use server'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { lookupBook } from '@/lib/bookApi'
import { todayStr } from '@/lib/dates'
import { notifyBookStarted } from '@/lib/notifications'
import { getSiteUrl } from '@/lib/siteUrl'
import type { BookStatus } from '@/lib/types'

export type BookFormState = { error?: string } | undefined
export type ActionResult = { error?: string } | undefined

type Supabase = Awaited<ReturnType<typeof createClient>>

const STATUSES: BookStatus[] = ['queued', 'reading', 'finished']

function str(formData: FormData, key: string): string | null {
  const value = formData.get(key)
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function int(formData: FormData, key: string): number | null {
  const raw = str(formData, key)
  if (raw === null) return null
  const n = parseInt(raw, 10)
  return Number.isFinite(n) ? n : null
}

function readBookFields(formData: FormData) {
  const status = str(formData, 'status') as BookStatus | null
  return {
    title: str(formData, 'title'),
    author: str(formData, 'author'),
    cover_url: str(formData, 'cover_url'),
    genre: str(formData, 'genre'),
    page_count: int(formData, 'page_count'),
    status: status && STATUSES.includes(status) ? status : null,
    picked_by: str(formData, 'picked_by'),
    date_started: str(formData, 'date_started'),
    date_finished: str(formData, 'date_finished'),
    target_finish_date: str(formData, 'target_finish_date'),
    synopsis: str(formData, 'synopsis'),
    goodreads_id: str(formData, 'goodreads_id'),
    amazon_asin: str(formData, 'amazon_asin'),
  }
}

function validateBookFields(fields: ReturnType<typeof readBookFields>): string | null {
  if (!fields.title) return 'Title is required.'
  if (!fields.status) return 'Pick a status for the book.'
  if (fields.page_count !== null && fields.page_count < 1) {
    return 'Page count must be at least 1.'
  }
  if (
    fields.date_started &&
    fields.date_finished &&
    fields.date_finished < fields.date_started
  ) {
    return 'The finish date is before the start date.'
  }
  return null
}

function friendlyError(error: { message: string; code?: string }): string {
  if (error.code === '23505') {
    return 'Another book is already marked as currently reading. Finish that one first.'
  }
  if (/fetch failed|network/i.test(error.message)) {
    return "Couldn't reach the database. Please try again in a moment."
  }
  return error.message
}

/** Emails the club about a newly started book, once the response has gone out. */
async function announceBookStarted(supabase: Supabase, bookId: string) {
  const [
    {
      data: { user },
    },
    siteUrl,
  ] = await Promise.all([supabase.auth.getUser(), getSiteUrl()])
  after(() => notifyBookStarted(bookId, user?.id ?? null, siteUrl).catch(console.error))
}

function revalidateAll() {
  revalidatePath('/', 'layout')
}

/**
 * Only one book can be "reading" at a time, so starting a new one moves the
 * current one to history. Returns what was changed so it can be undone if the
 * next step fails.
 */
async function finishActiveBooks(supabase: Supabase, exceptId?: string) {
  const { data: activeBooks } = await supabase
    .from('books')
    .select('id, date_finished')
    .eq('status', 'reading')

  const changed: { id: string; date_finished: string | null }[] = []
  for (const active of activeBooks ?? []) {
    if (active.id === exceptId) continue
    const { error } = await supabase
      .from('books')
      .update({ status: 'finished', date_finished: active.date_finished ?? todayStr() })
      .eq('id', active.id)
    if (!error) changed.push(active)
  }
  return changed
}

async function restoreActiveBooks(
  supabase: Supabase,
  changed: { id: string; date_finished: string | null }[]
) {
  for (const book of changed) {
    await supabase
      .from('books')
      .update({ status: 'reading', date_finished: book.date_finished })
      .eq('id', book.id)
  }
}

export async function createBook(
  _prevState: BookFormState,
  formData: FormData
): Promise<BookFormState> {
  const supabase = await createClient()

  const fields = readBookFields(formData)
  const invalid = validateBookFields(fields)
  if (invalid) return { error: invalid }

  const isReading = fields.status === 'reading'
  const previouslyActive = isReading ? await finishActiveBooks(supabase) : []

  const { data: created, error } = await supabase
    .from('books')
    .insert({
      ...fields,
      open_library_id: str(formData, 'open_library_id'),
      date_started: fields.status === 'queued' ? null : fields.date_started,
      date_finished:
        fields.status === 'finished' ? (fields.date_finished ?? todayStr()) : null,
      target_finish_date: isReading ? fields.target_finish_date : null,
    })
    .select('id')
    .single()

  if (error) {
    await restoreActiveBooks(supabase, previouslyActive)
    return { error: friendlyError(error) }
  }

  if (isReading && created) await announceBookStarted(supabase, created.id)

  revalidateAll()
  redirect(isReading ? '/' : fields.status === 'finished' ? '/books' : '/want-to-read')
}

export async function addToWantToRead(
  _prevState: BookFormState,
  formData: FormData
): Promise<BookFormState> {
  const supabase = await createClient()

  const title = str(formData, 'title')
  if (!title) return { error: 'Title is required.' }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  // A failed lookup shouldn't stop the book being added.
  const result = await lookupBook(title).catch(() => null)

  const { error } = await supabase.from('books').insert({
    title: result?.title ?? title,
    author: result?.author ?? null,
    cover_url: result?.coverUrl ?? null,
    genre: result?.genre ?? null,
    open_library_id: result?.openLibraryId ?? null,
    page_count: result?.pageCount ?? null,
    status: 'queued',
    picked_by: user.id,
    pages_read_so_far: 0,
    synopsis: result?.synopsis ?? null,
    goodreads_id: result?.goodreadsId ?? null,
    amazon_asin: result?.amazonAsin ?? null,
  })

  if (error) return { error: friendlyError(error) }

  revalidateAll()
  return undefined
}

/**
 * Promotes a book from the want-to-read list to the club's current book.
 * `pickedBy` says whose pick it counts as (the list only records who
 * suggested it); leave it undefined to keep whoever is already on the book.
 */
export async function startReading(
  bookId: string,
  pickedBy?: string | null,
  targetFinishDate?: string | null
): Promise<ActionResult> {
  const supabase = await createClient()

  const previouslyActive = await finishActiveBooks(supabase, bookId)

  const { error } = await supabase
    .from('books')
    .update({
      status: 'reading',
      date_started: todayStr(),
      date_finished: null,
      pages_read_so_far: 0,
      ...(pickedBy ? { picked_by: pickedBy } : {}),
      ...(targetFinishDate && /^\d{4}-\d{2}-\d{2}$/.test(targetFinishDate)
        ? { target_finish_date: targetFinishDate }
        : {}),
    })
    .eq('id', bookId)

  if (error) {
    await restoreActiveBooks(supabase, previouslyActive)
    return { error: friendlyError(error) }
  }

  await announceBookStarted(supabase, bookId)

  revalidateAll()
  redirect('/')
}

/** Wraps up the club's current book and moves it to history. */
export async function finishBook(bookId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: book } = await supabase
    .from('books')
    .select('date_finished')
    .eq('id', bookId)
    .single()

  const { error } = await supabase
    .from('books')
    .update({
      status: 'finished',
      date_finished: book?.date_finished ?? todayStr(),
    })
    .eq('id', bookId)

  if (error) return { error: friendlyError(error) }

  revalidateAll()
  redirect(`/books/${bookId}`)
}

/** Corrects who picked (or suggested) a book. */
export async function updatePicker(bookId: string, pickedBy: string | null): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('books').update({ picked_by: pickedBy }).eq('id', bookId)
  if (error) return { error: friendlyError(error) }

  revalidateAll()
  return undefined
}

export async function deleteBook(bookId: string, redirectTo?: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('books').delete().eq('id', bookId)
  if (error) return { error: friendlyError(error) }

  revalidateAll()
  if (redirectTo) redirect(redirectTo)
  return undefined
}

export async function updateBook(
  bookId: string,
  _prevState: BookFormState,
  formData: FormData
): Promise<BookFormState> {
  const supabase = await createClient()

  const fields = readBookFields(formData)
  const invalid = validateBookFields(fields)
  if (invalid) return { error: invalid }

  const { error } = await supabase
    .from('books')
    .update({
      ...fields,
      date_finished:
        fields.status === 'finished' ? (fields.date_finished ?? todayStr()) : fields.date_finished,
    })
    .eq('id', bookId)

  if (error) return { error: friendlyError(error) }

  revalidateAll()
  redirect(`/books/${bookId}`)
}
