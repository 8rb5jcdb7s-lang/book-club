'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ProfileFormState = { error?: string; saved?: boolean } | undefined

export async function updateDisplayName(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in.' }

  const displayName = String(formData.get('display_name') ?? '').trim()
  if (!displayName) return { error: 'Name cannot be empty.' }
  if (displayName.length > 40) return { error: 'Keep it under 40 characters.' }

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return { saved: true }
}

/** Called after the browser has uploaded the image to the avatars bucket. */
export async function setAvatarUrl(url: string | null): Promise<ProfileFormState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in.' }

  const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return { saved: true }
}

export async function changePassword(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const supabase = await createClient()

  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')

  if (password.length < 8) return { error: 'Use at least 8 characters.' }
  if (password !== confirm) return { error: "The two passwords don't match." }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }

  return { saved: true }
}
