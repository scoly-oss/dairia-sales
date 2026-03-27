import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Header from '@/components/layout/Header'
import ClientIntelligenceProfile from '@/components/intelligence/ClientIntelligenceProfile'
import type { Profile } from '@/lib/types'

export default async function IntelligenceClientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { id } = await params

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { data: ci } = await supabase
    .from('client_intelligence')
    .select('*, prospect:prospects(*)')
    .eq('prospect_id', id)
    .single()

  if (!ci) notFound()

  const { data: opportunites } = await supabase
    .from('opportunites_ia')
    .select('*')
    .eq('prospect_id', id)
    .order('created_at', { ascending: false })

  const { data: propositions } = await supabase
    .from('propositions_intelligentes')
    .select('*, opportunite:opportunites_ia(titre, service_propose)')
    .eq('prospect_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col h-full">
      <Header
        profile={profile as Profile}
        title={`Intelligence — ${ci.prospect?.company_name ?? 'Client'}`}
      />
      <ClientIntelligenceProfile
        ci={ci}
        initialOpportunites={opportunites ?? []}
        initialPropositions={propositions ?? []}
      />
    </div>
  )
}
