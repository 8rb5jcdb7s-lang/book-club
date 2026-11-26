'use client'

import { useState } from 'react'
import { searchCovers, type CoverOption } from '@/lib/covers'

/** Lets the member pick from every cover we can find for the book. */
export default function CoverPicker({
  title,
  author,
  value,
  onChange,
}: {
  title: string
  author: string
  value: string
  onChange: (url: string) => void
}) {
  const [options, setOptions] = useState<CoverOption[] | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')

  async function load() {
    if (!title.trim()) return
    setStatus('loading')
    try {
      setOptions(await searchCovers(title, author || null))
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={load}
          disabled={status === 'loading' || !title.trim()}
          className="btn btn-secondary btn-sm"
        >
          {status === 'loading'
            ? 'Finding covers…'
            : options
              ? 'Search again'
              : 'Choose a cover'}
        </button>
        {value && (
          <button type="button" onClick={() => onChange('')} className="btn btn-ghost btn-sm">
            Remove cover
          </button>
        )}
        {!title.trim() && <span className="text-xs text-stone-500">Enter a title first.</span>}
      </div>

      {status === 'error' && (
        <p className="mt-2 text-xs text-red-600">Couldn&apos;t reach the cover sources. Try again.</p>
      )}

      {options && options.length === 0 && (
        <p className="mt-2 text-xs text-stone-500">
          No covers found. Check the title and author, or paste an image address below.
        </p>
      )}

      {options && options.length > 0 && (
        <>
          <p className="hint mt-3">Tap the one you like. Apple Books covers are the sharpest.</p>
          <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {options.map((option) => {
              const selected = option.url === value
              return (
                <li key={option.url}>
                  <button
                    type="button"
                    onClick={() => onChange(option.url)}
                    title={option.label}
                    aria-pressed={selected}
                    className={`block w-full overflow-hidden rounded-md bg-stone-100 transition-shadow ${
                      selected
                        ? 'ring-3 ring-amber-500'
                        : 'ring-1 ring-stone-300 hover:ring-2 hover:ring-stone-500'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={option.thumb}
                      alt={option.label}
                      loading="lazy"
                      className="aspect-[2/3] w-full object-cover"
                    />
                  </button>
                  <span className="mt-1 block text-center text-[10px] text-stone-500">
                    {option.source}
                  </span>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
