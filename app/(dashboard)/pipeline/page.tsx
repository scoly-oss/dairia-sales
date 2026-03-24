import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import KanbanBoard from '@/components/pipeline/KanbanBoard'
import type { Profile } from '@/lib/types'

export default async function PipelinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { data: deals } = await supabase
    .from('deals')
    .select(`
      *,
      prospect:prospects(id, company_name, score),
      assignee:profiles!deals_assigned_to_fkey(id, name)
    `)
    .order('created_at', { ascending: false })

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, email')

  return (
    <div className="flex flex-col h-full">
      <Header profile={profile as Profile} title="Pipeline commercial" />
      <KanbanBoard
        initialDeals={deals || []}
        profiles={profiles || []}
      />
    </div>
  )
}
