import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import ClientIntelligenceProfile from '@/components/intelligence/ClientIntelligenceProfile'
import type {
  Profile,
  ClientIntelligence,
  OpportuniteIA,
  PropositionIntelligente,
  Prospect,
} from '@/lib/types'

export default async function ClientIntelligencePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  // Charger en parallèle
  const [clientResult, oppsResult, propsResult] = await Promise.all([
    supabase
      .from('client_intelligence')
      .select('*, prospect:prospects(*, contacts(*))')
      .eq('prospect_id', id)
      .single(),
    supabase
      .from('opportunites_ia')
      .select('*')
      .eq('prospect_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('propositions_intelligentes')
      .select('*, opportunite:opportunites_ia(titre)')
      .eq('prospect_id', id)
      .order('date_envoi', { ascending: false }),
  ])

  if (clientResult.error || !clientResult.data) {
    // Tenter de créer un profil vide si prospect existe
    const { data: prospect } = await supabase
      .from('prospects')
      .select('*, contacts(*)')
      .eq('id', id)
      .single()

    if (!prospect) notFound()

    // Créer profil intelligence par défaut
    await supabase.from('client_intelligence').upsert({
      prospect_id: id,
      secteur: prospect.sector || null,
      effectif_tranche: 'moins_11',
      services_souscrits: [],
      score_opportunite: 0,
    }, { onConflict: 'prospect_id' })

    const { data: newClient } = await supabase
      .from('client_intelligence')
      .select('*, prospect:prospects(*, contacts(*))')
      .eq('prospect_id', id)
      .single()

    if (!newClient) notFound()

    return (
      <div className="flex flex-col h-full">
        <Header profile={profile as Profile} title={prospect.company_name} />
        <ClientIntelligenceProfile
          client={newClient as ClientIntelligence & { prospect: Prospect & { contacts?: Array<{ name: string; email: string | null; function: string | null; is_primary: boolean }> } }}
          opportunites={[]}
          propositions={[]}
        />
      </div>
    )
  }

  const client = clientResult.data as ClientIntelligence & { prospect: Prospect & { contacts?: Array<{ name: string; email: string | null; function: string | null; is_primary: boolean }> } }
  const opportunites = (oppsResult.data || []) as OpportuniteIA[]
  const propositions = (propsResult.data || []) as PropositionIntelligente[]

  return (
    <div className="flex flex-col h-full">
      <Header
        profile={profile as Profile}
        title={client.prospect.company_name}
      />
      <ClientIntelligenceProfile
        client={client}
        opportunites={opportunites}
        propositions={propositions}
      />
    </div>
  )
}
