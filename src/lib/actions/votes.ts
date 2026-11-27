'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/** Adds or removes the signed-in member's thumbs-up on a want-to-read book. */
export async function setVote(bookId: string, voted: boolean): Promise<{ error?: string } | undefined> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in.' }

  const { error } = voted
    ? await supabase
        .from('book_votes')
        .upsert({ book_id: bookId, user_id: user.id }, { onConflict: 'book_id,user_id' })
    : await supabase.from('book_votes').delete().eq('book_id', bookId).eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return undefined
}
