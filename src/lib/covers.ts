// Finding good book covers.
//
// Two free sources, neither needing an API key:
//  - Apple Books (the iTunes Search API): sharp, current-edition covers that
//    can be requested at any size. The first choice.
//  - Open Library: more editions (including older ones), lower resolution.

export type CoverOption = {
  /** Full-size image to store on the book. */
  url: string
  /** Small version for the picker grid. */
  thumb: string
  source: 'Apple Books' | 'Open Library'
  /** What the result is, e.g. the edition's title and author. */
  label: string
}

type AppleResult = { trackName?: string; artistName?: string; artworkUrl100?: string }
type OpenLibraryDoc = { key?: string; title?: string; author_name?: string[]; cover_i?: number }

const COVER_SIZE = '600x600bb'
const THUMB_SIZE = '200x200bb'

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[:(\[—–-].*$/, '') // drop subtitles and series notes
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/^(the|a|an) /, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Apple's catalogue is full of study guides and summaries of famous books.
const NOT_THE_BOOK = /\b(summary|study guide|analysis|sparknotes|cliffsnotes|workbook|notes on|a guide to|conversation starters|trivia|book review)\b/i

function appleArtwork(url: string, size: string): string {
  return url.replace(/\/\d+x\d+[a-z]*\.(jpg|png)$/i, `/${size}.$1`)
}

async function searchApple(title: string, author: string | null): Promise<CoverOption[]> {
  const term = encodeURIComponent(`${title} ${author ?? ''}`.trim())
  const res = await fetch(
    `https://itunes.apple.com/search?term=${term}&entity=ebook&limit=15&country=us`
  )
  if (!res.ok) return []
  const data: { results?: AppleResult[] } = await res.json()

  const wantedTitle = normalize(title)
  const authorWords = normalize(author ?? '').split(' ').filter((w) => w.length > 2)
  const lastName = authorWords[authorWords.length - 1]

  const scored: { option: CoverOption; score: number }[] = []
  for (const result of data.results ?? []) {
    if (!result.artworkUrl100 || !result.trackName) continue
    if (NOT_THE_BOOK.test(result.trackName)) continue

    const gotTitle = normalize(result.trackName)
    const titleExact = gotTitle === wantedTitle
    const titleClose = gotTitle.startsWith(wantedTitle) || wantedTitle.startsWith(gotTitle)
    if (!titleExact && !titleClose) continue

    const authorMatches = lastName ? normalize(result.artistName ?? '').includes(lastName) : true
    // With an author to go on, a different author means a different book.
    if (lastName && !authorMatches) continue

    scored.push({
      score: (titleExact ? 2 : 1) + (authorMatches && lastName ? 1 : 0),
      option: {
        url: appleArtwork(result.artworkUrl100, COVER_SIZE),
        thumb: appleArtwork(result.artworkUrl100, THUMB_SIZE),
        source: 'Apple Books',
        label: `${result.trackName}${result.artistName ? ` — ${result.artistName}` : ''}`,
      },
    })
  }

  return scored.sort((a, b) => b.score - a.score).map((s) => s.option)
}

function openLibraryCover(id: number): CoverOption {
  return {
    url: `https://covers.openlibrary.org/b/id/${id}-L.jpg`,
    thumb: `https://covers.openlibrary.org/b/id/${id}-M.jpg`,
    source: 'Open Library',
    label: 'Open Library edition',
  }
}

async function searchOpenLibrary(title: string, author: string | null): Promise<CoverOption[]> {
  const params = new URLSearchParams({ title, limit: '5', fields: 'key,title,author_name,cover_i' })
  if (author) params.set('author', author)
  const res = await fetch(`https://openlibrary.org/search.json?${params}`)
  if (!res.ok) return []
  const data: { docs?: OpenLibraryDoc[] } = await res.json()
  const docs = data.docs ?? []

  const ids: number[] = []
  for (const doc of docs) if (doc.cover_i) ids.push(doc.cover_i)

  // The best-matching work usually has many editions, each with its own cover.
  const workKey = docs[0]?.key
  if (workKey) {
    try {
      const editionsRes = await fetch(`https://openlibrary.org${workKey}/editions.json?limit=40`)
      if (editionsRes.ok) {
        const editions: { entries?: { covers?: number[]; languages?: { key: string }[] }[] } =
          await editionsRes.json()
        for (const edition of editions.entries ?? []) {
          const english =
            !edition.languages || edition.languages.some((l) => l.key === '/languages/eng')
          const id = edition.covers?.find((c) => c > 0)
          if (english && id) ids.push(id)
        }
      }
    } catch {
      // Editions are a bonus; the search results alone are fine.
    }
  }

  return [...new Set(ids)].slice(0, 9).map(openLibraryCover)
}

/** Every cover we can find for a book, best candidates first. */
export async function searchCovers(title: string, author: string | null): Promise<CoverOption[]> {
  if (!title.trim()) return []

  const [apple, openLibrary] = await Promise.all([
    searchApple(title, author).catch(() => []),
    searchOpenLibrary(title, author).catch(() => []),
  ])

  const seen = new Set<string>()
  return [...apple.slice(0, 6), ...openLibrary].filter((option) => {
    if (seen.has(option.url)) return false
    seen.add(option.url)
    return true
  })
}

/** The single best cover for a book, or null if nothing matched. */
export async function bestCover(title: string, author: string | null): Promise<string | null> {
  const apple = await searchApple(title, author).catch(() => [])
  return apple[0]?.url ?? null
}

/**
 * Open Library covers were originally saved at medium size (180px wide).
 * The large version of the same image is roughly twice as sharp.
 */
export function sharperCoverUrl(url: string): string {
  return url.replace(
    /^(https?:\/\/covers\.openlibrary\.org\/b\/[a-z]+\/[^/]+)-[SM]\.jpg$/i,
    '$1-L.jpg'
  )
}
