import Image from 'next/image'
import Link from 'next/link'
import Avatar from '@/components/Avatar'
import DeleteBookButton from '@/components/DeleteBookButton'
import WantToReadAddForm from '@/components/WantToReadAddForm'
import { createClient } from '@/lib/supabase/server'

export default async function WantToReadPage() {
  const supabase = await createClient()

  const { data: books } = await supabase
    .from('books')
    .select('*, picker:profiles!picked_by(display_name, avatar_url)')
    .eq('status', 'queued')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">Want to Read</h1>

      <WantToReadAddForm />

      {!books || books.length === 0 ? (
        <p className="text-sm text-stone-500">No books on the list yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {books.map((book) => (
            <div key={book.id} className="space-y-2">
              <Link href={`/books/${book.id}/edit`}>
                <div className="flex aspect-[2/3] items-center justify-center rounded-md border-2 border-stone-300 bg-stone-100 shadow-sm transition-transform hover:scale-[1.02]">
                  {book.cover_url ? (
                    <Image
                      src={book.cover_url}
                      alt={book.title}
                      width={160}
                      height={240}
                      className="h-full w-full object-contain"
                      unoptimized
                    />
                  ) : (
                    <span className="px-2 text-center text-xs text-stone-400">No cover</span>
                  )}
                </div>
              </Link>
              <div>
                <Link href={`/books/${book.id}/edit`}>
                  <p className="line-clamp-2 text-sm font-bold text-stone-900 hover:underline">
                    {book.title}
                  </p>
                </Link>
                {book.picker && (
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-stone-500">
                    <Avatar
                      name={book.picker.display_name}
                      url={book.picker.avatar_url}
                      size={5}
                    />
                    Added by {book.picker.display_name}
                  </div>
                )}
                <div className="mt-1">
                  <DeleteBookButton bookId={book.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
