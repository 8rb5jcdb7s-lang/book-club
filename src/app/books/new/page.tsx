import { createClient } from '@/lib/supabase/server'
import BookForm from '@/components/BookForm'

export default async function NewBookPage() {
  const supabase = await createClient()

  const [{ data: profiles }, { data: rotation }] = await Promise.all([
    supabase.from('profiles').select('*').order('display_name'),
    supabase.from('picker_rotation').select('member_order, current_index').eq('id', 1).single(),
  ])

  let defaultPickerId: string | null = null
  if (rotation && rotation.member_order.length > 0) {
    defaultPickerId = rotation.member_order[rotation.current_index] ?? null
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-stone-900">Add a book</h1>
      <BookForm profiles={profiles ?? []} defaultPickerId={defaultPickerId} />
    </div>
  )
}
