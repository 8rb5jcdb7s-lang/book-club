'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type RatingFormState = { error?: string } | undefined

export async function upsertRatingNote(
  _prevState: RatingFormState,
  formData: FormData
): Promise<RatingFormState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in.' }

  const bookId = formData.get('book_id') as string
  const ratingRaw = formData.get('rating') as string
  const notes = (formData.get('notes') as string) || null
  const rating = ratingRaw ? parseInt(ratingRaw, 10) : null

  const { error } = await supabase.from('ratings_notes').upsert(
    {
      book_id: bookId,
      user_id: user.id,
      rating,
      notes,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'book_id,user_id' }
  )

  if (error) return { error: error.message }

  revalidatePath(`/books/${bookId}`)
  revalidatePath('/stats')
  return undefined
}
