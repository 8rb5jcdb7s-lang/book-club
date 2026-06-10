import { createClient } from '@/lib/supabase/server'
import NowReadingCard from '@/components/NowReadingCard'
import PickerRotationCard from '@/components/PickerRotationCard'
import QuoteOfTheDayCard from '@/components/QuoteOfTheDayCard'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [{ data: book }, { data: rotation }, { data: profiles }, { data: { user } }] =
    await Promise.all([
      supabase
        .from('books')
        .select('*, picker:profiles!picked_by(display_name)')
        .eq('status', 'reading')
        .maybeSingle(),
      supabase
        .from('picker_rotation')
        .select('member_order, current_index')
        .eq('id', 1)
        .single(),
      supabase.from('profiles').select('*').order('display_name'),
      supabase.auth.getUser(),
    ])

  let finishers: { user_id: string; finished_at: string; profile: { display_name: string; avatar_url: string | null } }[] = []
  if (book) {
    const { data } = await supabase
      .from('book_finishes')
      .select('user_id, finished_at, profile:profiles!user_id(display_name, avatar_url)')
      .eq('book_id', book.id)
    finishers = (data as unknown as typeof finishers) ?? []
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <NowReadingCard book={book} finishers={finishers} currentUserId={user?.id ?? null} />
      </div>
      <QuoteOfTheDayCard />
      <div className="lg:col-span-2">
        <PickerRotationCard
          memberOrder={rotation?.member_order ?? []}
          currentIndex={rotation?.current_index ?? 0}
          profiles={profiles ?? []}
        />
      </div>
    </div>
  )
}
