'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateRotationOrder(memberOrder: string[]) {
  const supabase = await createClient()
  await supabase.from('picker_rotation').update({ member_order: memberOrder }).eq('id', 1)
  revalidatePath('/')
}
