import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import IntelligenceClient from '@/components/intelligence/IntelligenceClient'
import type { IntelligenceDashboardStats } from '@/lib/types'

export default async function IntelligencePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const [ciRes, oppRes, actuRes] = await Promise.all([
    supabase.from('client_intelligence').select('id, organisation_nom, score_opportunite, effectif_tranche, secteur').order('score_opportunite', { ascending: false }).limit(10),
    supabase.from('opportunites_ia').select('id, statut, ca_estime, type, organisation_nom, titre, created_at, client_intelligence_id, service_propose, description, email_genere, proposition_generee, updated_at, organisation_id, source, actu_id').order('created_at', { ascending: false }).limit(50),
    supabase.from('actu_impacts').select('*').order('created_at', { ascending: false }).limit(5),
  ])

  const opps = oppRes.data ?? []
  const nouvelles = opps.filter((o) => o.statut === 'nouvelle')
  const gagnees = opps.filter((o) => o.statut === 'gagnee')
  const caPotentiel = nouvelles.reduce((sum, o) => sum + (o.ca_estime || 0), 0)
  const tauxConversion = opps.length > 0 ? Math.round((gagnees.length / opps.length) * 100) : 0

  const stats: IntelligenceDashboardStats = {
    total_clients: ciRes.data?.length ?? 0,
    total_opportunites: opps.length,
    opportunites_nouvelles: nouvelles.length,
    ca_potentiel: caPotentiel,
    taux_conversion: tauxConversion,
    top_clients: ciRes.data ?? [],
    alertes_actus: actuRes.data ?? [],
    opportunites_recentes: opps,
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header profile={profile} title="Intelligence Client" />
      <main className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: '#f8f8f6' }}>
        <IntelligenceClient stats={stats} />
      </main>
    </div>
  )
}
