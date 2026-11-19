'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateRotation(
  memberOrder: string[],
  nextPickerId: string | null
): Promise<{ error?: string } | undefined> {
  const supabase = await createClient()

  const index = nextPickerId ? memberOrder.indexOf(nextPickerId) : -1

  const { error } = await supabase
    .from('picker_rotation')
    .update({ member_order: memberOrder, current_index: Math.max(0, index) })
    .eq('id', 1)

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return undefined
}
