import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import PropositionsClient from '@/components/propositions/PropositionsClient'
import type { Profile } from '@/lib/types'

export default async function PropositionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { data: propositions } = await supabase
    .from('propositions')
    .select(`
      *,
      prospect:prospects(id, company_name),
      items:proposition_items(*)
    `)
    .order('created_at', { ascending: false })

  const { data: prospects } = await supabase
    .from('prospects')
    .select('id, company_name')
    .order('company_name')

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .order('name')

  return (
    <div className="flex flex-col h-full">
      <Header profile={profile as Profile} title="Propositions commerciales" />
      <PropositionsClient
        initialPropositions={propositions || []}
        prospects={prospects || []}
        services={services || []}
      />
    </div>
  )
}
