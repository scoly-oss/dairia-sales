import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import ProspectDetail from '@/components/prospects/ProspectDetail'
import { notFound } from 'next/navigation'
import type { Profile } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProspectPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { data: prospect } = await supabase
    .from('prospects')
    .select(`
      *,
      contacts(*),
      interactions(*, profile:profiles(name)),
      deals(*, assignee:profiles!deals_assigned_to_fkey(name))
    `)
    .eq('id', id)
    .single()

  if (!prospect) notFound()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, email')

  return (
    <div className="flex flex-col h-full">
      <Header profile={profile as Profile} title={prospect.company_name} />
      <ProspectDetail prospect={prospect} currentUser={profile as Profile} profiles={profiles || []} />
    </div>
  )
}
