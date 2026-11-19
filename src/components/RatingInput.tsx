'use client'

import { startTransition, useActionState, useState } from 'react'
import { upsertRatingNote, type RatingFormState } from '@/lib/actions/ratings'

export default function RatingInput({
  bookId,
  initialRating,
  initialNotes,
  initialDidNotFinish = false,
}: {
  bookId: string
  initialRating: number | null
  initialNotes: string | null
  initialDidNotFinish?: boolean
}) {
  const [state, formAction, pending] = useActionState<RatingFormState, FormData>(
    upsertRatingNote,
    undefined
  )
  const [rating, setRating] = useState<number | null>(initialRating)
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [didNotFinish, setDidNotFinish] = useState(initialDidNotFinish)
  const [dirty, setDirty] = useState(false)

  return (
    <form
      // Submitted by hand (rather than via `action`) so React doesn't reset
      // the form afterwards, which would visually untick the checkbox.
      onSubmit={(e) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        setDirty(false)
        startTransition(() => formAction(formData))
      }}
      className="card space-y-4 p-5"
    >
      <input type="hidden" name="book_id" value={bookId} />
      <input type="hidden" name="rating" value={didNotFinish ? '' : (rating ?? '')} />
      <input type="hidden" name="did_not_finish" value={didNotFinish ? 'true' : 'false'} />

      <fieldset>
        <legend className="label">Your rating</legend>
        {didNotFinish ? (
          <p className="rounded-lg bg-stone-100 px-3 py-2.5 text-sm text-stone-600">
            Marked as <span className="font-semibold text-stone-800">did not finish</span> — no
            score, and it won&apos;t count toward the book&apos;s average.
          </p>
        ) : (
          <>
            <div
              className="grid grid-cols-5 gap-1 sm:grid-cols-10"
              role="radiogroup"
              aria-label="Rating out of 10"
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                const selected = rating === n
                const filled = rating !== null && n <= rating
                return (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={`${n} out of 10`}
                    onClick={() => {
                      setRating(selected ? null : n)
                      setDirty(true)
                    }}
                    className={`h-10 rounded-md text-sm font-semibold tabular-nums transition-colors ${
                      selected
                        ? 'bg-stone-900 text-white'
                        : filled
                          ? 'bg-amber-200 text-amber-950 hover:bg-amber-300'
                          : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                    }`}
                  >
                    {n}
                  </button>
                )
              })}
            </div>
            <p className="hint">
              {rating === null
                ? 'Tap a number from 1 to 10.'
                : 'Tap your rating again to clear it.'}
            </p>
          </>
        )}

        <label className="mt-3 flex w-fit cursor-pointer items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            checked={didNotFinish}
            onChange={(e) => {
              setDidNotFinish(e.target.checked)
              setDirty(true)
            }}
            className="h-4 w-4 accent-stone-900"
          />
          I didn&apos;t finish this one
        </label>
      </fieldset>

      <div>
        <label htmlFor="notes" className="label">
          {didNotFinish ? 'What happened?' : 'Your thoughts'}
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value)
            setDirty(true)
          }}
          placeholder={
            didNotFinish
              ? 'Where did you stop, and why? (optional)'
              : 'What did you think?'
          }
          className="input"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? 'Saving…' : 'Save'}
        </button>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state?.saved && !dirty && !pending && (
          <p className="text-sm font-medium text-emerald-700">Saved ✓</p>
        )}
      </div>
    </form>
  )
}
