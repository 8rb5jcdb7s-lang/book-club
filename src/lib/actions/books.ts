'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { lookupBook } from '@/lib/bookApi'
import type { BookStatus } from '@/lib/types'

export type BookFormState = { error?: string } | undefined

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function createBook(
  _prevState: BookFormState,
  formData: FormData
): Promise<BookFormState> {
  const supabase = await createClient()

  const title = (formData.get('title') as string)?.trim()
  if (!title) return { error: 'Title is required.' }

  const author = (formData.get('author') as string) || null
  const coverUrl = (formData.get('cover_url') as string) || null
  const genre = (formData.get('genre') as string) || null
  const openLibraryId = (formData.get('open_library_id') as string) || null
  const pageCountRaw = formData.get('page_count') as string
  const pageCount = pageCountRaw ? parseInt(pageCountRaw, 10) : null
  const status = formData.get('status') as BookStatus
  const pickedBy = (formData.get('picked_by') as string) || null
  const dateStarted = (formData.get('date_started') as string) || null
  const dateFinished = (formData.get('date_finished') as string) || null
  const targetFinishDate = (formData.get('target_finish_date') as string) || null
  const pagesReadRaw = formData.get('pages_read_so_far') as string
  const pagesReadSoFar = pagesReadRaw ? parseInt(pagesReadRaw, 10) : 0

  if (status === 'reading') {
    // Auto-finish whatever was previously the active book
    const { data: activeBooks } = await supabase
      .from('books')
      .select('id, date_finished')
      .eq('status', 'reading')

    for (const active of activeBooks ?? []) {
      await supabase
        .from('books')
        .update({
          status: 'finished',
          date_finished: active.date_finished ?? todayStr(),
        })
        .eq('id', active.id)
    }

    // Advance the picker rotation
    const { data: rotation } = await supabase
      .from('picker_rotation')
      .select('member_order, current_index')
      .eq('id', 1)
      .single()

    if (rotation && rotation.member_order.length > 0) {
      const nextIndex = (rotation.current_index + 1) % rotation.member_order.length
      await supabase
        .from('picker_rotation')
        .update({ current_index: nextIndex })
        .eq('id', 1)
    }
  }

  const { error } = await supabase.from('books').insert({
    title,
    author,
    cover_url: coverUrl,
    genre,
    open_library_id: openLibraryId,
    page_count: pageCount,
    status,
    picked_by: pickedBy,
    date_started: dateStarted,
    date_finished: dateFinished,
    target_finish_date: targetFinishDate,
    pages_read_so_far: pagesReadSoFar,
  })

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/books')
  redirect('/books')
}

export async function updatePagesRead(bookId: string, pages: number) {
  const supabase = await createClient()
  await supabase.from('books').update({ pages_read_so_far: pages }).eq('id', bookId)
  revalidatePath('/')
}

export async function deleteBook(bookId: string) {
  const supabase = await createClient()
  await supabase.from('books').delete().eq('id', bookId)
  revalidatePath('/')
  revalidatePath('/books')
  revalidatePath('/stats')
}

export async function updateBook(
  bookId: string,
  _prevState: BookFormState,
  formData: FormData
): Promise<BookFormState> {
  const supabase = await createClient()

  const title = (formData.get('title') as string)?.trim()
  if (!title) return { error: 'Title is required.' }

  const author = (formData.get('author') as string) || null
  const coverUrl = (formData.get('cover_url') as string) || null
  const genre = (formData.get('genre') as string) || null
  const pageCountRaw = formData.get('page_count') as string
  const pageCount = pageCountRaw ? parseInt(pageCountRaw, 10) : null
  const status = formData.get('status') as BookStatus
  const pickedBy = (formData.get('picked_by') as string) || null
  const dateStarted = (formData.get('date_started') as string) || null
  const dateFinished = (formData.get('date_finished') as string) || null
  const targetFinishDate = (formData.get('target_finish_date') as string) || null
  const pagesReadRaw = formData.get('pages_read_so_far') as string
  const pagesReadSoFar = pagesReadRaw ? parseInt(pagesReadRaw, 10) : 0

  const { error } = await supabase
    .from('books')
    .update({
      title,
      author,
      cover_url: coverUrl,
      genre,
      page_count: pageCount,
      status,
      picked_by: pickedBy,
      date_started: dateStarted,
      date_finished: dateFinished,
      target_finish_date: targetFinishDate,
      pages_read_so_far: pagesReadSoFar,
    })
    .eq('id', bookId)

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/books')
  revalidatePath(`/books/${bookId}`)
  redirect(`/books/${bookId}`)
}

export async function refreshAllTitles() {
  const supabase = await createClient()

  const { data: books } = await supabase.from('books').select('id, title, author, genre')

  for (const book of books ?? []) {
    const query = book.author ? `${book.title} ${book.author}` : book.title
    const result = await lookupBook(query)
    if (!result) continue

    const updates: Record<string, string | null> = {}
    if (result.title && result.title.toLowerCase() !== book.title.toLowerCase()) {
      updates.title = result.title
    }
    // Always overwrite genre with the freshly-derived value (even null), to
    // force-replace any stale/incorrect values from old lookups.
    updates.genre = result.genre

    await supabase.from('books').update(updates).eq('id', book.id)
  }

  revalidatePath('/')
  revalidatePath('/books')
  revalidatePath('/stats')
}
