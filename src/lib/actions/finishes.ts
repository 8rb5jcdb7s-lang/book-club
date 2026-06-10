'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function markFinished(bookId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('book_finishes').insert({
    book_id: bookId,
    user_id: user.id,
  })

  revalidatePath('/')
}

export async function unmarkFinished(bookId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('book_finishes')
    .delete()
    .eq('book_id', bookId)
    .eq('user_id', user.id)

  revalidatePath('/')
}
