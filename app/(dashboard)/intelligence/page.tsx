import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import IntelligenceClient from '@/components/intelligence/IntelligenceClient'
import type { Profile, IntelligenceDashboardStats } from '@/lib/types'

export default async function IntelligencePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [oppsRes, actusRes, clientsRes] = await Promise.all([
    supabase
      .from('opportunites_ia')
      .select('*, prospect:prospects(id, company_name, sector)')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('actu_impacts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('client_intelligence')
      .select('*, prospect:prospects(id, company_name, sector)')
      .order('score_opportunite', { ascending: false })
      .limit(10),
  ])

  const opportunites = oppsRes.data ?? []
  const actus = actusRes.data ?? []
  const topClients = clientsRes.data ?? []

  const actives = opportunites.filter(o => ['nouvelle', 'en_cours', 'proposee'].includes(o.statut))
  const caPotentiel = actives.reduce((sum: number, o: { ca_estime: number }) => sum + (o.ca_estime ?? 0), 0)
  const clientsIds = new Set(actives.map((o: { prospect_id: string }) => o.prospect_id))
  const nouvellesSemaine = opportunites.filter((o: { statut: string; created_at: string }) => o.statut === 'nouvelle' && o.created_at >= weekAgo).length
  const gagnees = opportunites.filter((o: { statut: string }) => o.statut === 'gagnee').length
  const totalTerminees = gagnees + opportunites.filter((o: { statut: string }) => o.statut === 'perdue').length
  const tauxConversion = totalTerminees > 0 ? Math.round((gagnees / totalTerminees) * 100) : 0

  const statutMap: Record<string, number> = {}
  for (const o of opportunites) {
    statutMap[o.statut] = (statutMap[o.statut] ?? 0) + 1
  }

  const stats: IntelligenceDashboardStats = {
    total_opportunites: actives.length,
    ca_potentiel: caPotentiel,
    clients_avec_opportunites: clientsIds.size,
    nouvelles_cette_semaine: nouvellesSemaine,
    taux_conversion: tauxConversion,
    opportunites_par_statut: statutMap,
  }

  return (
    <div className="flex flex-col h-full">
      <Header profile={profile as Profile} title="Intelligence Client" />
      <IntelligenceClient
        stats={stats}
        opportunites={opportunites}
        actus={actus}
        topClients={topClients}
      />
    </div>
  )
}
