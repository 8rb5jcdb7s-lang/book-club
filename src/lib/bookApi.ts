export type BookLookupResult = {
  title: string | null
  author: string | null
  pageCount: number | null
  genre: string | null
  coverUrl: string | null
  openLibraryId: string | null
  synopsis: string | null
  goodreadsId: string | null
  amazonAsin: string | null
}

type OpenLibraryDoc = {
  title?: string
  author_name?: string[]
  number_of_pages_median?: number
  subject?: string[]
  cover_i?: number
  key?: string
}

type OpenLibrarySearchResponse = {
  docs?: OpenLibraryDoc[]
}

type OpenLibraryEdition = {
  title?: string
  languages?: { key: string }[]
  identifiers?: { goodreads?: string[]; amazon?: string[] }
}

type OpenLibraryEditionsResponse = {
  entries?: OpenLibraryEdition[]
}

// Ordered most-specific-first so e.g. "Science Fiction" wins over generic "Fiction"
// when a book's subject list contains both.
const GENRE_WHITELIST = [
  'Science Fiction',
  'Fantasy',
  'Mystery',
  'Thriller',
  'Horror',
  'Romance',
  'Historical Fiction',
  'Biography',
  'Memoir',
  'Poetry',
  'Young Adult',
  'Graphic Novel',
  'Short Stories',
  'Drama',
  'Adventure',
  'Crime',
  'Dystopia',
  'Self-Help',
  'Philosophy',
  'Psychology',
  'History',
  'Humor',
  'Classic',
  'Fiction',
  'Nonfiction',
]

// Open Library returns subjects roughly in order of relevance, but mixes in
// generic/unrelated tags (e.g. "Mystery" shows up on "Heart of Darkness").
// Scanning the whitelist against *all* subjects with substring matching picks
// up these unrelated tags. Instead, scan subjects in order and only take an
// exact match against the whitelist, so the most relevant subject wins.
const GENRE_LOOKUP = new Map(
  GENRE_WHITELIST.map((g) => [g.toLowerCase().replace(/-/g, ' '), g])
)

function deriveGenre(subjects: string[] | undefined): string | null {
  if (!subjects?.length) return null

  for (const subject of subjects) {
    const normalized = subject.toLowerCase().replace(/[-,]/g, ' ').replace(/\s+/g, ' ').trim()
    const match = GENRE_LOOKUP.get(normalized)
    if (match) return match
  }

  return null
}

// Fraction of words starting with an uppercase letter, used to prefer
// "The Vegetarian" over a lowercased variant like "The vegetarian".
function titleCaseScore(title: string): number {
  const words = title.split(/\s+/).filter(Boolean)
  if (words.length === 0) return 0
  const capitalized = words.filter((w) => /^[A-Z]/.test(w)).length
  return capitalized / words.length
}

async function getEditions(workKey: string): Promise<OpenLibraryEdition[]> {
  const res = await fetch(`https://openlibrary.org${workKey}/editions.json?limit=50`)
  if (!res.ok) return []

  const data: OpenLibraryEditionsResponse = await res.json()
  return data.entries ?? []
}

// Open Library's search "title" is the work's title, often in its original
// language (e.g. the Korean title for "The Vegetarian"). Look through the
// work's editions for one in English and use its title instead.
function getEnglishTitle(editions: OpenLibraryEdition[]): string | null {
  const englishTitles = editions
    .filter((e) => e.languages?.some((l) => l.key === '/languages/eng') && e.title)
    .map((e) => e.title as string)

  if (englishTitles.length === 0) return null

  return englishTitles.sort((a, b) => titleCaseScore(b) - titleCaseScore(a))[0]
}

// Real Amazon ASINs (as opposed to ISBNs that Open Library sometimes lists
// under the same "amazon" identifier field) start with a letter, e.g. "B00...".
// Only these reliably resolve to a product page on amazon.com.
const ASIN_FORMAT = /^B[A-Z0-9]{9}$/

// Find a Goodreads book ID and an Amazon ASIN from whichever edition lists them.
function getEditionLinks(editions: OpenLibraryEdition[]): {
  goodreadsId: string | null
  amazonAsin: string | null
} {
  let goodreadsId: string | null = null
  let amazonAsin: string | null = null

  for (const edition of editions) {
    if (!goodreadsId && edition.identifiers?.goodreads?.[0]) {
      goodreadsId = edition.identifiers.goodreads[0]
    }
    if (!amazonAsin) {
      const asin = edition.identifiers?.amazon?.find((id) => ASIN_FORMAT.test(id))
      if (asin) amazonAsin = asin
    }
    if (goodreadsId && amazonAsin) break
  }

  return { goodreadsId, amazonAsin }
}

// Open Library's search "title" is usually fine for works originally
// published in Latin-script languages (e.g. "Heart of Darkness" stays as-is).
// For non-Latin scripts (Hangul, CJK, Cyrillic, Greek, Arabic, Hebrew), the
// work title is often the original-language title, so look for an English
// edition title instead.
const NON_LATIN_SCRIPT =
  /\p{Script=Hangul}|\p{Script=Han}|\p{Script=Cyrillic}|\p{Script=Greek}|\p{Script=Arabic}|\p{Script=Hebrew}/u

type OpenLibraryWork = {
  description?: string | { value?: string }
}

async function getSynopsis(workKey: string): Promise<string | null> {
  const res = await fetch(`https://openlibrary.org${workKey}.json`)
  if (!res.ok) return null

  const data: OpenLibraryWork = await res.json()
  const description = data.description
  if (!description) return null

  const text = typeof description === 'string' ? description : description.value
  if (!text) return null

  // Strip Open Library's "([source][id])" attribution suffixes some
  // descriptions end with.
  return text.replace(/\s*\(source:.*?\)\s*$/i, '').trim()
}

export async function lookupBook(query: string): Promise<BookLookupResult | null> {
  if (!query.trim()) return null

  const olUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(
    query
  )}&limit=1&fields=title,author_name,number_of_pages_median,subject,cover_i,key`

  const olRes = await fetch(olUrl)
  if (!olRes.ok) return null

  const data: OpenLibrarySearchResponse = await olRes.json()
  const doc = data.docs?.[0]
  if (!doc) return null

  const editions = doc.key ? await getEditions(doc.key) : []

  const englishTitle =
    doc.title && NON_LATIN_SCRIPT.test(doc.title) ? getEnglishTitle(editions) : null

  const synopsis = doc.key ? await getSynopsis(doc.key) : null
  const { goodreadsId, amazonAsin } = getEditionLinks(editions)

  return {
    title: englishTitle ?? doc.title ?? null,
    author: doc.author_name?.[0] ?? null,
    pageCount: doc.number_of_pages_median ?? null,
    genre: deriveGenre(doc.subject),
    coverUrl: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : null,
    openLibraryId: doc.key ?? null,
    synopsis,
    goodreadsId,
    amazonAsin,
  }
}
