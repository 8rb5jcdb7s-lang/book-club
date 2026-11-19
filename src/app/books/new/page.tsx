import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import BookForm from '@/components/BookForm'
import { todayStr } from '@/lib/dates'
import { pickQueue } from '@/lib/picks'
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

  const [{ data: profiles }, { data: pickedBooks }] = await Promise.all([
    supabase.from('profiles').select('*').order('display_name'),
    supabase
      .from('books')
      .select('id, title, status, picked_by, date_started, date_finished, created_at')
      .in('status', ['reading', 'finished']),
  ])

  // Pre-select whoever has waited longest since their last pick.
  const defaultPickerId = pickQueue(pickedBooks ?? [], profiles ?? [])[0]?.profile.id ?? null

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
