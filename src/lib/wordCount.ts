// Rough industry-standard estimate for words per printed page.
export const WORDS_PER_PAGE = 275

export type WordReference = {
  label: string
  words: number
  note: string
}

// Approximate word counts for fun size comparisons.
export const WORD_REFERENCES: WordReference[] = [
  { label: 'the Quran', words: 77000, note: 'English translation' },
  { label: 'an IPO prospectus', words: 50000, note: 'a ~200-page S-1 filing' },
  { label: 'The Hobbit', words: 95000, note: '' },
  { label: 'The Lord of the Rings', words: 481000, note: 'all three volumes' },
  { label: 'the Bible', words: 783000, note: 'King James Version' },
  { label: 'the Harry Potter series', words: 1084000, note: 'all 7 books' },
]

export function formatWordComparison(totalWords: number, ref: WordReference): string {
  const multiple = totalWords / ref.words
  if (multiple >= 1) {
    return `${multiple.toFixed(1)}x ${ref.label}`
  }
  return `${Math.round(multiple * 100)}% of ${ref.label}`
}
