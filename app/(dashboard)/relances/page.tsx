import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import RelancesClient from '@/components/relances/RelancesClient'
import type { Profile } from '@/lib/types'

export default async function RelancesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { data: tasks } = await supabase
    .from('tasks')
    .select(`
      *,
      prospect:prospects(id, company_name),
      deal:deals(id, title),
      assignee:profiles!tasks_assigned_to_fkey(name)
    `)
    .order('due_date', { ascending: true, nullsFirst: false })

  const { data: prospects } = await supabase
    .from('prospects')
    .select('id, company_name')
    .order('company_name')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, email')

  return (
    <div className="flex flex-col h-full">
      <Header profile={profile as Profile} title="Relances & Tâches" />
      <RelancesClient
        initialTasks={tasks || []}
        prospects={prospects || []}
        profiles={profiles || []}
        currentUser={profile as Profile}
      />
    </div>
  )
}
