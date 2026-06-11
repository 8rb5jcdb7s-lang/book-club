'use client'

import { useActionState } from 'react'
import { updateBook, type BookFormState } from '@/lib/actions/books'
import type { Book, Profile } from '@/lib/types'

export default function EditBookForm({
  book,
  profiles,
}: {
  book: Book
  profiles: Profile[]
}) {
  const [state, formAction, pending] = useActionState<BookFormState, FormData>(
    updateBook.bind(null, book.id),
    undefined
  )

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-stone-700">Title</label>
        <input
          name="title"
          defaultValue={book.title}
          required
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700">Author</label>
          <input
            name="author"
            defaultValue={book.author ?? ''}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700">Page count</label>
          <input
            name="page_count"
            type="number"
            min="1"
            defaultValue={book.page_count ?? ''}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700">Genre</label>
          <input
            name="genre"
            defaultValue={book.genre ?? ''}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700">Cover URL</label>
          <input
            name="cover_url"
            defaultValue={book.cover_url ?? ''}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700">Synopsis</label>
        <textarea
          name="synopsis"
          defaultValue={book.synopsis ?? ''}
          rows={4}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700">Goodreads ID</label>
          <input
            name="goodreads_id"
            defaultValue={book.goodreads_id ?? ''}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700">Amazon ASIN/ISBN</label>
          <input
            name="amazon_asin"
            defaultValue={book.amazon_asin ?? ''}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700">Status</label>
        <select
          name="status"
          defaultValue={book.status}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
        >
          <option value="reading">Currently reading</option>
          <option value="finished">Finished</option>
          <option value="queued">Queued</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700">Picked by</label>
        <select
          name="picked_by"
          defaultValue={book.picked_by ?? ''}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
        >
          <option value="">—</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.display_name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700">Date started</label>
          <input
            name="date_started"
            type="date"
            defaultValue={book.date_started ?? ''}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700">Date finished</label>
          <input
            name="date_finished"
            type="date"
            defaultValue={book.date_finished ?? ''}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700">
            Target finish date
          </label>
          <input
            name="target_finish_date"
            type="date"
            defaultValue={book.target_finish_date ?? ''}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700">
            Pages read so far
          </label>
          <input
            name="pages_read_so_far"
            type="number"
            min="0"
            defaultValue={book.pages_read_so_far}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-stone-900 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-stone-700 hover:shadow-lg active:scale-95 transition-all disabled:opacity-50"
      >
        {pending ? 'Saving...' : 'Save changes'}
      </button>
    </form>
  )
}
