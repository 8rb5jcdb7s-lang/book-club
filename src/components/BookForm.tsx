'use client'

import { useActionState, useState } from 'react'
import { createBook, type BookFormState } from '@/lib/actions/books'
import { lookupBook } from '@/lib/bookApi'
import type { Profile } from '@/lib/types'

export default function BookForm({
  profiles,
  defaultPickerId,
}: {
  profiles: Profile[]
  defaultPickerId: string | null
}) {
  const [state, formAction, pending] = useActionState<BookFormState, FormData>(
    createBook,
    undefined
  )

  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [pageCount, setPageCount] = useState('')
  const [genre, setGenre] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [openLibraryId, setOpenLibraryId] = useState('')
  const [synopsis, setSynopsis] = useState('')
  const [goodreadsId, setGoodreadsId] = useState('')
  const [amazonAsin, setAmazonAsin] = useState('')
  const [status, setStatus] = useState<'queued' | 'reading' | 'finished'>('reading')
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'loading' | 'done' | 'error'>(
    'idle'
  )

  async function handleLookup() {
    if (!title.trim()) return
    setLookupStatus('loading')
    try {
      const result = await lookupBook(`${title} ${author}`.trim())
      if (!result) {
        setLookupStatus('error')
        return
      }
      if (result.title && result.title.toLowerCase() !== title.trim().toLowerCase()) {
        setTitle(result.title)
      }
      if (result.author && !author) setAuthor(result.author)
      if (result.pageCount) setPageCount(String(result.pageCount))
      if (result.genre) setGenre(result.genre)
      if (result.coverUrl) setCoverUrl(result.coverUrl)
      if (result.openLibraryId) setOpenLibraryId(result.openLibraryId)
      if (result.synopsis) setSynopsis(result.synopsis)
      if (result.goodreadsId) setGoodreadsId(result.goodreadsId)
      if (result.amazonAsin) setAmazonAsin(result.amazonAsin)
      setLookupStatus('done')
    } catch {
      setLookupStatus('error')
    }
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-stone-700">Title</label>
        <div className="mt-1 flex gap-2">
          <input
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleLookup}
            disabled={lookupStatus === 'loading' || !title.trim()}
            className="shrink-0 rounded-lg border-2 border-stone-300 px-4 py-2 text-sm font-bold text-stone-700 shadow-sm hover:bg-stone-50 hover:shadow-md active:scale-95 transition-all disabled:opacity-50"
          >
            {lookupStatus === 'loading' ? 'Looking up...' : 'Look up'}
          </button>
        </div>
        {lookupStatus === 'done' && (
          <p className="mt-1 text-xs text-green-700">
            Filled in details from Open Library — feel free to edit.
          </p>
        )}
        {lookupStatus === 'error' && (
          <p className="mt-1 text-xs text-stone-500">
            No match found — enter details manually.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700">Author</label>
          <input
            name="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700">Page count</label>
          <input
            name="page_count"
            type="number"
            min="1"
            value={pageCount}
            onChange={(e) => setPageCount(e.target.value)}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700">Genre</label>
          <input
            name="genre"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700">Cover URL</label>
          <input
            name="cover_url"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
      </div>
      <input type="hidden" name="open_library_id" value={openLibraryId} />
      <input type="hidden" name="goodreads_id" value={goodreadsId} />
      <input type="hidden" name="amazon_asin" value={amazonAsin} />

      <div>
        <label className="block text-sm font-medium text-stone-700">Synopsis</label>
        <textarea
          name="synopsis"
          value={synopsis}
          onChange={(e) => setSynopsis(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700">Status</label>
        <select
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
        >
          <option value="reading">Currently reading (sets as the active book)</option>
          <option value="finished">Already finished (add to history)</option>
          <option value="queued">Queued for later</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700">Picked by</label>
        <select
          name="picked_by"
          defaultValue={defaultPickerId ?? ''}
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
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
        {status === 'reading' ? (
          <div>
            <label className="block text-sm font-medium text-stone-700">
              Target finish date
            </label>
            <input
              name="target_finish_date"
              type="date"
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-stone-700">
              Date finished
            </label>
            <input
              name="date_finished"
              type="date"
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
            />
          </div>
        )}
      </div>

      {status === 'reading' && (
        <div>
          <label className="block text-sm font-medium text-stone-700">
            Pages read so far
          </label>
          <input
            name="pages_read_so_far"
            type="number"
            min="0"
            defaultValue="0"
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
          />
        </div>
      )}

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-stone-900 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-stone-700 hover:shadow-lg active:scale-95 transition-all disabled:opacity-50"
      >
        {pending ? 'Saving...' : 'Save book'}
      </button>
    </form>
  )
}
