'use client'

import { useState } from 'react'
import { sharperCoverUrl } from '@/lib/covers'

function searchLinks(title: string, author: string | null) {
  const query = encodeURIComponent(`${title} ${author ?? ''}`.trim())
  return {
    goodreads: `https://www.goodreads.com/search?q=${query}`,
    amazon: `https://www.amazon.com/s?k=${query}&i=stripbooks`,
  }
}

// Every cover is shown in the same 2:3 frame. Images close to that shape fill
// it; anything squarer or taller is shown whole over a blurred copy of itself,
// so nothing gets cropped and the shelf still looks even.
const FRAME_RATIO = 2 / 3
const RATIO_TOLERANCE = 0.09

// Cloth-bound colours for books with no cover image, chosen by title so a
// book always gets the same one.
const CLOTH = [
  { background: '#7c2d12', ink: '#fde68a' },
  { background: '#14532d', ink: '#fef3c7' },
  { background: '#1e3a8a', ink: '#fde68a' },
  { background: '#581c87', ink: '#fbcfe8' },
  { background: '#0f766e', ink: '#fef9c3' },
  { background: '#44403c', ink: '#fcd34d' },
  { background: '#9f1239', ink: '#ffe4e6' },
]

function clothFor(title: string) {
  let hash = 0
  for (const ch of title) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return CLOTH[hash % CLOTH.length]
}

function GeneratedCover({ title, author }: { title: string; author: string | null }) {
  const cloth = clothFor(title)
  return (
    <span
      className="flex h-full w-full p-[6%] [container-type:inline-size]"
      style={{ backgroundColor: cloth.background, color: cloth.ink }}
    >
      <span
        className="flex h-full w-full flex-col items-center justify-center gap-[6cqw] rounded-[2px] border px-[7cqw] text-center"
        style={{ borderColor: `${cloth.ink}66` }}
      >
        <span className="line-clamp-5 font-serif text-[13cqw] leading-[1.15] font-semibold [overflow-wrap:anywhere]">
          {title}
        </span>
        {author && (
          <span className="line-clamp-2 text-[8cqw] leading-tight tracking-wide uppercase opacity-80">
            {author}
          </span>
        )}
      </span>
    </span>
  )
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
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const [oddShape, setOddShape] = useState(false)

  const src = coverUrl ? sharperCoverUrl(coverUrl) : null
  const broken = src !== null && failedUrl === src

  const face =
    'absolute inset-0 overflow-hidden rounded-md bg-stone-200 shadow-md ring-1 ring-stone-900/10'

  const front =
    src && !broken ? (
      <>
        {oddShape && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-125 object-cover opacity-80 blur-md"
          />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={src}
          src={src}
          alt={`Cover of ${title}`}
          onError={() => setFailedUrl(src)}
          onLoad={(e) => {
            const { naturalWidth, naturalHeight } = e.currentTarget
            // Open Library answers with a 1×1 blank image when it has no cover.
            if (naturalWidth <= 1) {
              setFailedUrl(src)
              return
            }
            setOddShape(Math.abs(naturalWidth / naturalHeight - FRAME_RATIO) > RATIO_TOLERANCE)
          }}
          className={`relative h-full w-full ${oddShape ? 'object-contain' : 'object-cover'}`}
        />
      </>
    ) : (
      <GeneratedCover title={title} author={author} />
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
