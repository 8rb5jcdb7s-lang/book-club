import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { deleteBook } from '@/lib/actions/books'
import { todayStr } from '@/lib/dates'
import BookForm from '@/components/BookForm'
import ConfirmActionButton from '@/components/ConfirmActionButton'

export const metadata: Metadata = { title: 'Edit book' }

export default async function EditBookPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: book }, { data: profiles }] = await Promise.all([
    supabase.from('books').select('*').eq('id', id).maybeSingle(),
    supabase.from('profiles').select('*').order('display_name'),
  ])

  if (!book) notFound()

  const afterDelete =
    book.status === 'queued' ? '/want-to-read' : book.status === 'finished' ? '/books' : '/'

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href={`/books/${book.id}`} className="text-sm text-stone-500 hover:text-stone-900">
          ← Back to book
        </Link>
        <h1 className="page-title mt-1">Edit book</h1>
      </div>

      <BookForm book={book} profiles={profiles ?? []} today={todayStr()} />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50/50 p-5">
        <div>
          <p className="text-sm font-semibold text-stone-900">Delete this book</p>
          <p className="text-sm text-stone-600">
            Removes the book along with everyone&apos;s ratings, notes and quotes for it.
          </p>
        </div>
        <ConfirmActionButton
          action={deleteBook.bind(null, book.id, afterDelete)}
          confirmMessage={`Delete "${book.title}" and all of its ratings, notes and quotes? This can't be undone.`}
          pendingLabel="Deleting…"
          className="btn btn-danger"
        >
          Delete book
        </ConfirmActionButton>
      </div>
    </div>
  )
}
