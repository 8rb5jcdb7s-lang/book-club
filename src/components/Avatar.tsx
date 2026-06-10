import Image from 'next/image'

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase()
}

export default function Avatar({
  name,
  url,
  size = 8,
}: {
  name: string
  url?: string | null
  size?: number
}) {
  const dimension = size * 4 // tailwind spacing unit -> px
  const className = `inline-flex shrink-0 items-center justify-center rounded-full border border-stone-300 bg-stone-100 text-xs font-bold text-stone-600 overflow-hidden`
  const style = { width: dimension, height: dimension }

  if (url) {
    return (
      <Image
        src={url}
        alt={name}
        width={dimension}
        height={dimension}
        className={`${className} object-cover`}
        style={style}
        unoptimized
      />
    )
  }

  return (
    <span className={className} style={style}>
      {initials(name)}
    </span>
  )
}
