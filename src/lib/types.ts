export type BookStatus = 'queued' | 'reading' | 'finished'

export type Profile = {
  id: string
  display_name: string
  avatar_url: string | null
  created_at: string
}

export type Book = {
  id: string
  title: string
  author: string | null
  cover_url: string | null
  page_count: number | null
  genre: string | null
  open_library_id: string | null
  status: BookStatus
  picked_by: string | null
  date_started: string | null
  date_finished: string | null
  target_finish_date: string | null
  pages_read_so_far: number
  created_at: string
}

export type RatingNote = {
  id: string
  book_id: string
  user_id: string
  rating: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type Quote = {
  id: string
  book_id: string
  user_id: string
  quote_text: string
  page_number: number | null
  created_at: string
}

export type BookFinish = {
  id: string
  book_id: string
  user_id: string
  finished_at: string
}

export type PickerRotation = {
  id: number
  member_order: string[]
  current_index: number
}
