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
  // The score is a whole number picked from the row of buttons, plus an
  // optional half point.
  const [whole, setWhole] = useState<number | null>(
    initialRating === null ? null : Math.floor(initialRating)
  )
  const [half, setHalf] = useState(initialRating !== null && !Number.isInteger(initialRating))
  const rating = whole === null ? null : whole + (half && whole < 10 ? 0.5 : 0)
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [didNotFinish, setDidNotFinish] = useState(initialDidNotFinish)
  const [dirty, setDirty] = useState(false)

  return (
    <form
      // `action` is the fallback if Save is pressed before the page's scripts
      // have loaded. Normally onSubmit takes over and submits by hand, so
      // React doesn't reset the form afterwards (which would visually untick
      // the checkbox).
      action={formAction}
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
          <p className="panel px-3 py-2.5 text-sm text-stone-600">
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
                const selected = whole === n
                const filled = whole !== null && n <= whole
                // The cell after the chosen number shows the extra half point.
                const halfFilled = rating !== null && whole !== null && n === whole + 1 && rating > whole
                return (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={`${n} out of 10`}
                    onClick={() => {
                      if (selected) {
                        setWhole(null)
                        setHalf(false)
                      } else {
                        setWhole(n)
                        if (n === 10) setHalf(false)
                      }
                      setDirty(true)
                    }}
                    className={`h-10 rounded-xl border-2 text-sm font-extrabold tabular-nums transition-colors ${
                      selected
                        ? 'border-ink bg-ink text-white'
                        : filled
                          ? 'border-ink bg-sun text-ink hover:bg-amber-400'
                          : halfFilled
                            ? 'border-ink bg-linear-to-r from-sun from-50% to-white to-50% text-stone-600'
                            : 'border-stone-300 bg-white text-stone-500 hover:border-ink hover:text-ink'
                    }`}
                  >
                    {n}
                  </button>
                )
              })}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <button
                type="button"
                aria-pressed={half}
                disabled={whole === null || whole === 10}
                onClick={() => {
                  setHalf(!half)
                  setDirty(true)
                }}
                className={`btn btn-sm ${
                  half && whole !== null && whole < 10
                    ? 'bg-sun'
                    : 'btn-secondary'
                }`}
              >
                + ½ point
              </button>
              <p className="text-sm text-stone-500">
                {rating === null ? (
                  'Tap a number, then add a half point if you need one.'
                ) : (
                  <>
                    Your score:{' '}
                    <span className="font-semibold text-stone-900 tabular-nums">
                      {rating} / 10
                    </span>
                    <span className="text-stone-400"> · tap the number again to clear</span>
                  </>
                )}
              </p>
            </div>
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
