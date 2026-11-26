'use client'

import { useState } from 'react'
import { sharperCoverUrl } from '@/lib/covers'

// Every cover is shown in the same 2:3 shape. Images close to that shape fill it; anything squarer or taller is
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
      className="flex h-full w-full p-[7%] [container-type:inline-size]"
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
 * A book cover shown as a sticker: the cover art exactly as it is, inside a
 * thin white die-cut edge, a rounded ink outline and a small flat shadow.
 * Nothing is drawn over the picture itself.
 *
 * Size it with `className` (a 2:3 box, e.g. `aspect-[2/3] w-40`). The edge
 * and shadow scale with the cover, so it looks the same large or small.
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
    <div className={`relative [container-type:inline-size] ${className}`}>
      <span className="absolute inset-0 block rounded-[9%/6%] border-2 border-ink bg-white p-[2.2cqw] shadow-[2.4cqw_3.2cqw_0_0_var(--color-ink)]">
        <span className="relative block h-full w-full overflow-hidden rounded-[6.5%/4.3%] bg-stone-200">
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
                  setOddShape(
                    Math.abs(naturalWidth / naturalHeight - FRAME_RATIO) > RATIO_TOLERANCE
                  )
                }}
                className={`relative h-full w-full ${oddShape ? 'object-contain' : 'object-cover'}`}
              />
            </>
          ) : (
            <GeneratedCover title={title} author={author} />
          )}
        </span>
      </span>
    </div>
  )
}
