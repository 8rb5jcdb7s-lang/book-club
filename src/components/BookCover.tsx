'use client'

import { useState } from 'react'
import { sharperCoverUrl } from '@/lib/covers'

// Every cover is drawn as the front of a little cartoon book in the same 2:3
// shape. Images close to that shape fill it; anything squarer or taller is
// shown whole over a blurred copy of itself, so nothing gets cropped.
const FRAME_RATIO = 2 / 3
const RATIO_TOLERANCE = 0.09

// Cloth-bound colours for books with no cover image, chosen by title so a
// book always gets the same one.
const CLOTH = [
  { background: '#9a3412', ink: '#fde68a' },
  { background: '#166534', ink: '#fef3c7' },
  { background: '#1d4ed8', ink: '#fde68a' },
  { background: '#6b21a8', ink: '#fbcfe8' },
  { background: '#0f766e', ink: '#fef9c3' },
  { background: '#57534e', ink: '#fcd34d' },
  { background: '#be123c', ink: '#ffe4e6' },
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
      className="flex h-full w-full p-[7%] pl-[14%] [container-type:inline-size]"
      style={{ backgroundColor: cloth.background, color: cloth.ink }}
    >
      <span
        className="flex h-full w-full flex-col items-center justify-center gap-[6cqw] rounded-[6%] border-2 px-[6cqw] text-center"
        style={{ borderColor: `${cloth.ink}55` }}
      >
        <span className="line-clamp-5 font-serif text-[13cqw] leading-[1.15] font-semibold [overflow-wrap:anywhere]">
          {title}
        </span>
        {author && (
          <span className="line-clamp-2 text-[8cqw] leading-tight font-bold tracking-wide uppercase opacity-80">
            {author}
          </span>
        )}
      </span>
    </span>
  )
}

/**
 * A book, drawn cartoon-style: the cover art on the front, a darker spine
 * down the left, and the cream page block peeking out along the right and
 * bottom edges so it reads as a 3D object.
 *
 * Size it with `className` (a 2:3 box, e.g. `aspect-[2/3] w-40`).
 */
export default function BookCover({
  coverUrl,
  title,
  author,
  className = '',
}: {
  coverUrl: string | null
  title: string
  author: string | null
  className?: string
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const [oddShape, setOddShape] = useState(false)

  const src = coverUrl ? sharperCoverUrl(coverUrl) : null
  const broken = src !== null && failedUrl === src

  return (
    <div className={`relative ${className}`}>
      {/* The page block, offset down and to the right of the cover. */}
      <span
        className="absolute top-[5%] right-0 bottom-0 left-[8%] rounded-[4%_12%_14%_6%/3%_8%_9%_5%] border-2 border-ink bg-[#fffaf0] shadow-[inset_-3px_-3px_0_0_#eadfca]"
        aria-hidden="true"
      />
      {/* The front cover. */}
      <span className="absolute top-0 right-[6%] bottom-[4.5%] left-0 block overflow-hidden rounded-[5%_11%_11%_5%/3.500%_7.500%_7.500%_3.500%] border-2 border-ink bg-stone-200">
        {src && !broken ? (
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
        )}
        {/* Spine shading, the crease beside it, and a soft highlight. */}
        <span
          className="pointer-events-none absolute inset-y-0 left-0 w-[9%] bg-gradient-to-r from-black/35 to-black/5"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute inset-y-0 left-[9%] w-[1.5%] bg-white/30"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10"
          aria-hidden="true"
        />
      </span>
    </div>
  )
}
