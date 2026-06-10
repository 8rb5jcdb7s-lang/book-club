import { createClient } from '@/lib/supabase/server'
import NowReadingCard from '@/components/NowReadingCard'
import PickerRotationCard from '@/components/PickerRotationCard'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [{ data: book }, { data: rotation }, { data: profiles }] = await Promise.all([
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
  ])

  return (
    <div className="space-y-6">
      <NowReadingCard book={book} />
      <PickerRotationCard
        memberOrder={rotation?.member_order ?? []}
        currentIndex={rotation?.current_index ?? 0}
        profiles={profiles ?? []}
      />
    </div>
  )
}
