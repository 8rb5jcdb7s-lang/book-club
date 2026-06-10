'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type QuoteFormState = { error?: string } | undefined

export async function addQuote(
  _prevState: QuoteFormState,
  formData: FormData
): Promise<QuoteFormState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in.' }

  const bookId = formData.get('book_id') as string
  const quoteText = (formData.get('quote_text') as string)?.trim()
  if (!quoteText) return { error: 'Quote cannot be empty.' }

  const pageRaw = formData.get('page_number') as string
  const pageNumber = pageRaw ? parseInt(pageRaw, 10) : null

  const { error } = await supabase.from('quotes').insert({
    book_id: bookId,
    user_id: user.id,
    quote_text: quoteText,
    page_number: pageNumber,
  })

  if (error) return { error: error.message }

  revalidatePath(`/books/${bookId}`)
  revalidatePath('/stats')
  return undefined
}

export async function deleteQuote(quoteId: string, bookId: string) {
  const supabase = await createClient()
  await supabase.from('quotes').delete().eq('id', quoteId)
  revalidatePath(`/books/${bookId}`)
  revalidatePath('/stats')
}
