import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import BookForm from '@/components/BookForm'
import { todayStr } from '@/lib/dates'
import type { BookStatus } from '@/lib/types'

export const metadata: Metadata = { title: 'Add a book' }

const STATUSES: BookStatus[] = ['reading', 'finished', 'queued']

export default async function NewBookPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const supabase = await createClient()

  const [{ data: profiles }, { data: rotation }] = await Promise.all([
    supabase.from('profiles').select('*').order('display_name'),
    supabase
      .from('picker_rotation')
      .select('member_order, current_index')
      .eq('id', 1)
      .maybeSingle(),
  ])

  const defaultPickerId = rotation?.member_order?.[rotation.current_index] ?? null

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="page-title">Add a book</h1>
      <BookForm
        profiles={profiles ?? []}
        defaultPickerId={defaultPickerId}
        defaultStatus={STATUSES.find((s) => s === status) ?? 'reading'}
        today={todayStr()}
      />
    </div>
  )
}
