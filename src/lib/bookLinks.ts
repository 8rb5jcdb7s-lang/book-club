import type { Book } from './types'

type LinkBook = Pick<Book, 'title' | 'author' | 'goodreads_id' | 'amazon_asin'>

// "Dungeon Crawler Carl: Book 1 (A LitRPG Adventure)" -> "Dungeon Crawler Carl"
function mainTitle(title: string): string {
  return title
    .replace(/\s*[\(\[].*?[\)\]]/g, '')
    .replace(/\s*[:—–].*$/, '')
    .trim() || title.trim()
}

/**
 * Goodreads: straight to the book's page when we know its Goodreads id.
 * Otherwise a search on the title alone, limited to the title field —
 * Goodreads' search gets confused when the author's name is mixed into the
 * query, and returns unrelated books.
 */
export function goodreadsUrl(book: LinkBook): string {
  if (book.goodreads_id) {
    return `https://www.goodreads.com/book/show/${encodeURIComponent(book.goodreads_id)}`
  }
  const params = new URLSearchParams({
    q: mainTitle(book.title),
    search_type: 'books',
    'search[field]': 'title',
  })
  return `https://www.goodreads.com/search?${params}`
}

/**
 * Amazon: the product page when we have a real ASIN, otherwise a search of
 * the Books department. Amazon's search copes well with title plus author,
 * and the author helps when the title is a common phrase.
 */
export function amazonUrl(book: LinkBook): string {
  if (book.amazon_asin) {
    return `https://www.amazon.com/dp/${encodeURIComponent(book.amazon_asin)}`
  }
  const params = new URLSearchParams({
    k: `${mainTitle(book.title)} ${book.author ?? ''}`.trim(),
    i: 'stripbooks',
  })
  return `https://www.amazon.com/s?${params}`
}
