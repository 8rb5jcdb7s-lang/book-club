'use client'

import { useState } from 'react'

function searchLinks(title: string, author: string | null) {
  const query = encodeURIComponent(`${title} ${author ?? ''}`.trim())
  return {
    goodreads: `https://www.goodreads.com/search?q=${query}`,
    amazon: `https://www.amazon.com/s?k=${query}&i=stripbooks`,
  }
}

/**
 * A book cover. When a synopsis is available, clicking the cover flips it
 * over to show the synopsis plus Goodreads / Amazon links.
 */
export default function BookCover({
  coverUrl,
  title,
  author,
  synopsis,
  className = '',
}: {
  coverUrl: string | null
  title: string
  author: string | null
  synopsis?: string | null
  className?: string
}) {
  const [flipped, setFlipped] = useState(false)
  const [broken, setBroken] = useState(false)

  const face =
    'absolute inset-0 overflow-hidden rounded-md bg-stone-100 shadow-md ring-1 ring-stone-900/10'

  const front =
    coverUrl && !broken ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={coverUrl}
        alt={`Cover of ${title}`}
        onError={() => setBroken(true)}
        // Open Library answers with a 1x1 blank image when it has no cover.
        onLoad={(e) => {
          if (e.currentTarget.naturalWidth <= 1) setBroken(true)
        }}
        className="h-full w-full object-cover"
      />
    ) : (
      <span className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-stone-200 to-stone-300 p-2 text-center">
        <span className="line-clamp-4 font-serif text-xs leading-tight font-semibold text-stone-700">
          {title}
        </span>
        {author && <span className="line-clamp-1 text-[10px] text-stone-500">{author}</span>}
      </span>
    )

  if (!synopsis) {
    return (
      <div className={`relative ${className}`}>
        <div className={face}>{front}</div>
      </div>
    )
  }

  const { goodreads, amazon } = searchLinks(title, author)

  return (
    <div className={`relative [perspective:1000px] ${className}`}>
      <div
        className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${
          flipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        <button
          type="button"
          onClick={() => setFlipped(true)}
          className={`${face} group/cover [backface-visibility:hidden]`}
          aria-label={`Show synopsis for ${title}`}
          tabIndex={flipped ? -1 : 0}
        >
          {front}
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1 pt-4 pb-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover/cover:opacity-100">
            Flip for synopsis
          </span>
        </button>
        <div
          className={`${face} flex flex-col bg-white [backface-visibility:hidden] [transform:rotateY(180deg)]`}
        >
          <button
            type="button"
            onClick={() => setFlipped(false)}
            className="flex-1 overflow-y-auto p-2 text-left text-[11px] leading-snug text-stone-700"
            aria-label={`Show cover of ${title}`}
            tabIndex={flipped ? 0 : -1}
          >
            {synopsis}
          </button>
          <div className="flex justify-between gap-2 border-t border-stone-200 px-2 py-1 text-[10px] font-semibold">
            <a
              href={goodreads}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={flipped ? 0 : -1}
              className="text-stone-600 hover:text-stone-900 hover:underline"
            >
              Goodreads
            </a>
            <a
              href={amazon}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={flipped ? 0 : -1}
              className="text-stone-600 hover:text-stone-900 hover:underline"
            >
              Amazon
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
