'use client'

import { useState } from 'react'
import Image from 'next/image'

function searchLinks(title: string, author: string | null) {
  const query = encodeURIComponent(`${title} ${author ?? ''}`.trim())
  return {
    goodreads: `https://www.goodreads.com/search?q=${query}`,
    amazon: `https://www.amazon.com/s?k=${query}&i=stripbooks`,
  }
}

export default function BookCoverFlip({
  coverUrl,
  title,
  author,
  synopsis,
  className = '',
}: {
  coverUrl: string | null
  title: string
  author: string | null
  synopsis: string | null
  className?: string
}) {
  const [flipped, setFlipped] = useState(false)

  const coverContent = coverUrl ? (
    <Image
      src={coverUrl}
      alt={title}
      width={160}
      height={240}
      className="h-full w-full object-contain"
      unoptimized
    />
  ) : (
    <span className="px-2 text-center text-xs text-stone-400">No cover</span>
  )

  if (!synopsis) {
    return (
      <div className={`relative ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center rounded-md border-2 border-stone-300 bg-stone-100 shadow-sm">
          {coverContent}
        </div>
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
          className="absolute inset-0 flex items-center justify-center rounded-md border-2 border-stone-300 bg-stone-100 shadow-sm [backface-visibility:hidden]"
          aria-label={`Show synopsis for ${title}`}
        >
          {coverContent}
        </button>
        <div className="absolute inset-0 flex flex-col overflow-hidden rounded-md border-2 border-stone-300 bg-white shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <button
            type="button"
            onClick={() => setFlipped(false)}
            className="flex-1 overflow-y-auto p-2 text-left text-[11px] leading-snug text-stone-700"
            aria-label={`Show ${title} cover`}
          >
            {synopsis}
          </button>
          <div className="flex gap-2 border-t border-stone-200 px-2 py-1 text-[10px] font-medium">
            <a
              href={goodreads}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-stone-600 hover:underline"
            >
              Goodreads
            </a>
            <a
              href={amazon}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-stone-600 hover:underline"
            >
              Buy now
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
