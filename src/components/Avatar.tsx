function initials(name: string): string {
  return name.slice(0, 2).toUpperCase()
}

export default function Avatar({
  name,
  url,
  size = 8,
  tooltip,
}: {
  name: string
  url?: string | null
  size?: number
  tooltip?: string
}) {
  const dimension = size * 4 // tailwind spacing unit -> px
  const className = `inline-flex shrink-0 items-center justify-center rounded-full border border-stone-300 bg-stone-100 text-xs font-bold text-stone-600 overflow-hidden`
  const style = { width: dimension, height: dimension }

  return (
    <span className="group relative inline-flex hover:z-10">
      {url ? (
        <span className={`${className} transition-transform duration-150 group-hover:scale-125`} style={style}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={name}
            width={dimension}
            height={dimension}
            className="h-full w-full object-cover"
            loading="eager"
            decoding="async"
          />
        </span>
      ) : (
        <span className={className} style={style}>
          {initials(name)}
        </span>
      )}
      <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-stone-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100">
        {tooltip ?? name}
      </span>
    </span>
  )
}
