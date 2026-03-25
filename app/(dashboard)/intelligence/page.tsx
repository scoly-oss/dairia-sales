import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import IntelligenceClient from '@/components/intelligence/IntelligenceClient'
import type {
  Profile,
  IntelligenceDashboardStats,
  OpportuniteIA,
  ClientIntelligence,
  ActuImpact,
} from '@/lib/types'

export default async function IntelligencePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  // Charger les données en parallèle
  const [oppsResult, clientsResult, actusResult, propsResult] = await Promise.all([
    supabase
      .from('opportunites_ia')
      .select('*, prospect:prospects(id, company_name, sector)')
      .order('created_at', { ascending: false }),
    supabase
      .from('client_intelligence')
      .select('*, prospect:prospects(id, company_name, score)')
      .order('score_opportunite', { ascending: false }),
    supabase
      .from('actu_impacts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('propositions_intelligentes').select('id, resultat'),
  ])

  const opps = (oppsResult.data || []) as OpportuniteIA[]
  const clients = (clientsResult.data || []) as ClientIntelligence[]
  const actus = (actusResult.data || []) as ActuImpact[]
  const props = propsResult.data || []

  const startOfWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const stats: IntelligenceDashboardStats = {
    total_opportunites: opps.length,
    nouvelles_cette_semaine: opps.filter((o) => o.created_at >= startOfWeek).length,
    ca_potentiel: opps
      .filter((o) => ['nouvelle', 'vue', 'proposee'].includes(o.statut))
      .reduce((sum, o) => sum + (o.ca_estime || 0), 0),
    taux_conversion:
      props.length > 0
        ? Math.round(
            (props.filter((p) => p.resultat === 'converti').length / props.length) * 100
          )
        : 0,
    opportunites_non_exploitees: opps.filter((o) =>
      ['nouvelle', 'vue'].includes(o.statut)
    ).length,
  }

  return (
    <div className="flex flex-col h-full">
      <Header profile={profile as Profile} title="Intelligence Client" />
      <IntelligenceClient
        stats={stats}
        opportunites={opps}
        clients={clients}
        actus={actus}
      />
    </div>
  )
}
