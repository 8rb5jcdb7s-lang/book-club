'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { createBook, updateBook, type BookFormState } from '@/lib/actions/books'
import { lookupBook } from '@/lib/bookApi'
import BookCover from '@/components/BookCover'
import CoverPicker from '@/components/CoverPicker'
import type { Book, BookStatus, Profile } from '@/lib/types'

/** Create form when `book` is omitted, edit form when it's provided. */
export default function BookForm({
  book,
  profiles,
  defaultPickerId = null,
  defaultStatus = 'reading',
  today,
}: {
  book?: Book
  profiles: Profile[]
  defaultPickerId?: string | null
  defaultStatus?: BookStatus
  /** Today's date (YYYY-MM-DD) in the club's time zone. */
  today: string
}) {
  const isEdit = Boolean(book)
  const [state, formAction, pending] = useActionState<BookFormState, FormData>(
    book ? updateBook.bind(null, book.id) : createBook,
    undefined
  )

  const [title, setTitle] = useState(book?.title ?? '')
  const [author, setAuthor] = useState(book?.author ?? '')
  const [pageCount, setPageCount] = useState(book?.page_count?.toString() ?? '')
  const [genre, setGenre] = useState(book?.genre ?? '')
  const [coverUrl, setCoverUrl] = useState(book?.cover_url ?? '')
  const [openLibraryId, setOpenLibraryId] = useState(book?.open_library_id ?? '')
  const [synopsis, setSynopsis] = useState(book?.synopsis ?? '')
  const [goodreadsId, setGoodreadsId] = useState(book?.goodreads_id ?? '')
  const [amazonAsin, setAmazonAsin] = useState(book?.amazon_asin ?? '')
  const [status, setStatus] = useState<BookStatus>(book?.status ?? defaultStatus)
  const [pickedBy, setPickedBy] = useState(book?.picked_by ?? defaultPickerId ?? '')
  const [dateStarted, setDateStarted] = useState(book?.date_started ?? (isEdit ? '' : today))
  const [dateFinished, setDateFinished] = useState(book?.date_finished ?? '')
  const [targetFinishDate, setTargetFinishDate] = useState(book?.target_finish_date ?? '')
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

  const statusOptions: { value: BookStatus; label: string; hint: string }[] = [
    { value: 'reading', label: 'Reading now', hint: 'Becomes the club’s current book' },
    { value: 'finished', label: 'Finished', hint: 'Goes straight to History' },
    { value: 'queued', label: 'Want to read', hint: 'Saved to the list for later' },
  ]

  return (
    <form action={formAction} className="card space-y-6 p-5 sm:p-6">
      <div className="flex gap-5">
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <label htmlFor="title" className="label">
              Title
            </label>
            <div className="flex gap-2">
              <input
                id="title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  // Enter in the title box looks the book up rather than
                  // submitting a half-filled form.
                  if (e.key === 'Enter' && !isEdit && lookupStatus === 'idle') {
                    e.preventDefault()
                    handleLookup()
                  }
                }}
                required
                autoFocus={!isEdit}
                placeholder="e.g. The Remains of the Day"
                className="input"
              />
              <button
                type="button"
                onClick={handleLookup}
                disabled={lookupStatus === 'loading' || !title.trim()}
                className="btn btn-secondary shrink-0"
              >
                {lookupStatus === 'loading' ? 'Looking up…' : 'Look up'}
              </button>
            </div>
            <p
              className={`hint ${lookupStatus === 'done' ? 'text-emerald-700' : ''}`}
              role="status"
            >
              {lookupStatus === 'done'
                ? 'Filled in details from Open Library — edit anything that looks off.'
                : lookupStatus === 'error'
                  ? 'No match found — fill in the details by hand.'
                  : 'Type a title and press “Look up” to fill in the rest automatically.'}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="author" className="label">
                Author
              </label>
              <input
                id="author"
                name="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="page_count" className="label">
                  Pages
                </label>
                <input
                  id="page_count"
                  name="page_count"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={pageCount}
                  onChange={(e) => setPageCount(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="genre" className="label">
                  Genre
                </label>
                <input
                  id="genre"
                  name="genre"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="input"
                />
              </div>
            </div>
          </div>
        </div>

        <BookCover
          coverUrl={coverUrl || null}
          title={title || 'Cover'}
          author={author || null}
          className="hidden aspect-[2/3] w-28 shrink-0 self-start sm:block"
        />
      </div>

      <div>
        <p className="label">Cover</p>
        <div className="flex gap-4">
          <BookCover
            coverUrl={coverUrl || null}
            title={title || 'Cover'}
            author={author || null}
            className="aspect-[2/3] w-16 shrink-0 self-start sm:hidden"
          />
          <div className="min-w-0 flex-1">
            <CoverPicker title={title} author={author} value={coverUrl} onChange={setCoverUrl} />
          </div>
        </div>
      </div>

      <fieldset>
        <legend className="label">Status</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {statusOptions.map((option) => (
            <label
              key={option.value}
              className={`cursor-pointer rounded-2xl border-2 px-3 py-2 transition-colors ${
                status === option.value
                  ? 'border-ink bg-sun text-ink shadow-[0_3px_0_0_var(--color-ink)]'
                  : 'border-stone-300 bg-white text-stone-700 hover:border-stone-400'
              }`}
            >
              <input
                type="radio"
                name="status"
                value={option.value}
                checked={status === option.value}
                onChange={() => setStatus(option.value)}
                className="sr-only"
              />
              <span className="block text-sm font-extrabold">{option.label}</span>
              <span
                className={`block text-xs ${
                  status === option.value ? 'text-stone-700' : 'text-stone-500'
                }`}
              >
                {option.hint}
              </span>
            </label>
          ))}
        </div>
        {!isEdit && status === 'reading' && (
          <p className="hint">
            The book you&apos;re reading now (if any) moves to History.
          </p>
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="picked_by" className="label">
            {status === 'queued' ? 'Suggested by' : 'Picked by'}
          </label>
          <select
            id="picked_by"
            name="picked_by"
            value={pickedBy}
            onChange={(e) => setPickedBy(e.target.value)}
            className="input"
          >
            <option value="">—</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name}
              </option>
            ))}
          </select>
        </div>

        {status !== 'queued' && (
          <div>
            <label htmlFor="date_started" className="label">
              Date started
            </label>
            <input
              id="date_started"
              name="date_started"
              type="date"
              value={dateStarted}
              onChange={(e) => setDateStarted(e.target.value)}
              className="input"
            />
          </div>
        )}

        {status === 'reading' && (
          <>
            <div>
              <label htmlFor="target_finish_date" className="label">
                Target finish date
              </label>
              <input
                id="target_finish_date"
                name="target_finish_date"
                type="date"
                min={dateStarted || undefined}
                value={targetFinishDate}
                onChange={(e) => setTargetFinishDate(e.target.value)}
                className="input"
              />
              <p className="hint">Sets the countdown and the page you should be on each day.</p>
            </div>
          </>
        )}

        {status === 'finished' && (
          <div>
            <label htmlFor="date_finished" className="label">
              Date finished
            </label>
            <input
              id="date_finished"
              name="date_finished"
              type="date"
              min={dateStarted || undefined}
              value={dateFinished}
              onChange={(e) => setDateFinished(e.target.value)}
              className="input"
            />
            <p className="hint">Leave blank to use today.</p>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="synopsis" className="label">
          Synopsis
        </label>
        <textarea
          id="synopsis"
          name="synopsis"
          value={synopsis}
          onChange={(e) => setSynopsis(e.target.value)}
          rows={4}
          className="input"
        />
      </div>

      <details className="panel px-4 py-3 text-sm">
        <summary className="cursor-pointer font-medium text-stone-700">
          Cover image &amp; links
        </summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="cover_url" className="label">
              Cover image URL
            </label>
            <input
              id="cover_url"
              name="cover_url"
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://…"
              className="input"
            />
          </div>
          <div>
            <label htmlFor="goodreads_id" className="label">
              Goodreads ID
            </label>
            <input
              id="goodreads_id"
              name="goodreads_id"
              value={goodreadsId}
              onChange={(e) => setGoodreadsId(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="amazon_asin" className="label">
              Amazon ASIN
            </label>
            <input
              id="amazon_asin"
              name="amazon_asin"
              value={amazonAsin}
              onChange={(e) => setAmazonAsin(e.target.value)}
              className="input"
            />
          </div>
        </div>
      </details>
      <input type="hidden" name="open_library_id" value={openLibraryId} />

      {state?.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Save book'}
        </button>
        <Link href={book ? `/books/${book.id}` : '/'} className="btn btn-ghost">
          Cancel
        </Link>
      </div>
    </form>
  )
}
