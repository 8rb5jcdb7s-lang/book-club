'use server'

import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { notifyFinished } from '@/lib/notifications'
import { getSiteUrl } from '@/lib/siteUrl'
import { createClient } from '@/lib/supabase/server'

export async function markFinished(bookId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase
    .from('book_finishes')
    .upsert({ book_id: bookId, user_id: user.id }, { onConflict: 'book_id,user_id' })

  if (!error) {
    // Tell everyone else (once per person per book), after the response.
    const siteUrl = await getSiteUrl()
    const finisherId = user.id
    after(() => notifyFinished(bookId, finisherId, siteUrl).catch(console.error))
  }

  revalidatePath('/', 'layout')
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

  revalidatePath('/', 'layout')
}
