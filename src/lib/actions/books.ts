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
  const synopsis = (formData.get('synopsis') as string) || null
  const goodreadsId = (formData.get('goodreads_id') as string) || null
  const amazonAsin = (formData.get('amazon_asin') as string) || null

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
    synopsis,
    goodreads_id: goodreadsId,
    amazon_asin: amazonAsin,
  })

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/books')
  redirect('/books')
}

export async function addToWantToRead(
  _prevState: BookFormState,
  formData: FormData
): Promise<BookFormState> {
  const supabase = await createClient()

  const title = (formData.get('title') as string)?.trim()
  if (!title) return { error: 'Title is required.' }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in.' }

  const result = await lookupBook(title)

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

  if (error) return { error: error.message }

  revalidatePath('/want-to-read')
  return undefined
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
  revalidatePath('/want-to-read')
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
  const synopsis = (formData.get('synopsis') as string) || null
  const goodreadsId = (formData.get('goodreads_id') as string) || null
  const amazonAsin = (formData.get('amazon_asin') as string) || null

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
      synopsis,
      goodreads_id: goodreadsId,
      amazon_asin: amazonAsin,
    })
    .eq('id', bookId)

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/books')
  revalidatePath('/want-to-read')
  revalidatePath(`/books/${bookId}`)
  redirect(`/books/${bookId}`)
}
