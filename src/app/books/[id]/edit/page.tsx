import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EditBookForm from '@/components/EditBookForm'

export default async function EditBookPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: book }, { data: profiles }] = await Promise.all([
    supabase.from('books').select('*').eq('id', id).single(),
    supabase.from('profiles').select('*').order('display_name'),
  ])

  if (!book) notFound()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-stone-900">Edit book</h1>
      <EditBookForm book={book} profiles={profiles ?? []} />
    </div>
  )
}
