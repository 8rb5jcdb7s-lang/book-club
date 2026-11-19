'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type RatingFormState = { error?: string; saved?: boolean } | undefined

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
  const notes = ((formData.get('notes') as string) ?? '').trim() || null
  const didNotFinish = formData.get('did_not_finish') === 'true'
  // A book you didn't finish doesn't get a score.
  const rating = didNotFinish || !ratingRaw ? null : parseFloat(ratingRaw)

  // Whole or half points only, from 1 to 10.
  if (rating !== null && !(rating >= 1 && rating <= 10 && Number.isInteger(rating * 2))) {
    return { error: 'Rating must be between 1 and 10, in half-point steps.' }
  }
  if (rating === null && notes === null && !didNotFinish) {
    return { error: 'Add a rating or a few thoughts first.' }
  }

  const row = {
    book_id: bookId,
    user_id: user.id,
    rating,
    notes,
    updated_at: new Date().toISOString(),
  }

  let { error } = await supabase
    .from('ratings_notes')
    .upsert({ ...row, did_not_finish: didNotFinish }, { onConflict: 'book_id,user_id' })

  // The did_not_finish column is added by a migration. Until it has been run,
  // ordinary ratings should keep working.
  const columnMissing =
    error && (error.code === 'PGRST204' || error.code === '42703') &&
    /did_not_finish/.test(error.message)
  if (columnMissing) {
    if (didNotFinish) {
      return {
        error:
          '"Did not finish" needs a one-time database update: run supabase/migrations/add_did_not_finish.sql in the Supabase SQL editor.',
      }
    }
    ;({ error } = await supabase
      .from('ratings_notes')
      .upsert(row, { onConflict: 'book_id,user_id' }))
  }

  // Half points need the rating column to accept decimals (one-time migration).
  if (error?.code === '22P02' && rating !== null && !Number.isInteger(rating)) {
    return {
      error:
        'Half-point ratings need a one-time database update: run supabase/migrations/add_half_point_ratings.sql in the Supabase SQL editor.',
    }
  }
  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return { saved: true }
}
