import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { IntelligenceDashboardStats } from '@/lib/types'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  // Nombre total de clients avec profil intelligence
  const { count: totalClients } = await supabase
    .from('client_intelligence')
    .select('*', { count: 'exact', head: true })

  // Clients avec au moins une opportunité active
  const { data: oppsActives } = await supabase
    .from('opportunites_ia')
    .select('prospect_id')
    .in('statut', ['detectee', 'en_cours'])

  const prospectsAvecOpps = new Set((oppsActives ?? []).map((o) => o.prospect_id))

  // Opportunités créées cette semaine
  const uneSemaine = new Date()
  uneSemaine.setDate(uneSemaine.getDate() - 7)
  const { count: oppsSemaine } = await supabase
    .from('opportunites_ia')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', uneSemaine.toISOString())

  // CA potentiel total (opportunités actives)
  const { data: caPotentielData } = await supabase
    .from('opportunites_ia')
    .select('ca_estime')
    .in('statut', ['detectee', 'en_cours'])

  const caPotentiel = (caPotentielData ?? []).reduce(
    (sum, o) => sum + (o.ca_estime ?? 0),
    0
  )

  // Taux de conversion (convertie / (convertie + ignoree + envoyee))
  const { data: statsConversion } = await supabase
    .from('opportunites_ia')
    .select('statut')
    .in('statut', ['convertie', 'ignoree', 'envoyee'])

  const totalTraitees = (statsConversion ?? []).length
  const converties = (statsConversion ?? []).filter((o) => o.statut === 'convertie').length
  const tauxConversion = totalTraitees > 0 ? Math.round((converties / totalTraitees) * 100) : 0

  // Top 10 clients par score d'opportunité
  const { data: topClients } = await supabase
    .from('client_intelligence')
    .select('*, prospect:prospects(*)')
    .order('score_opportunite', { ascending: false })
    .limit(10)

  // Enrichir avec le nombre d'opportunités actives
  const topClientsEnrichis = await Promise.all(
    (topClients ?? []).map(async (ci) => {
      const { count } = await supabase
        .from('opportunites_ia')
        .select('*', { count: 'exact', head: true })
        .eq('prospect_id', ci.prospect_id)
        .in('statut', ['detectee', 'en_cours'])
      return { ...ci, opportunites_count: count ?? 0 }
    })
  )

  // Alertes actus récentes
  const { data: alertesActus } = await supabase
    .from('actu_impacts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  // Opportunités récentes
  const { data: opportunitesRecentes } = await supabase
    .from('opportunites_ia')
    .select('*, prospect:prospects(company_name)')
    .eq('statut', 'detectee')
    .order('created_at', { ascending: false })
    .limit(8)

  const stats: IntelligenceDashboardStats = {
    total_clients: totalClients ?? 0,
    clients_avec_opportunites: prospectsAvecOpps.size,
    opportunites_semaine: oppsSemaine ?? 0,
    ca_potentiel: caPotentiel,
    taux_conversion: tauxConversion,
    top_clients: topClientsEnrichis,
    alertes_actus: alertesActus ?? [],
    opportunites_recentes: opportunitesRecentes ?? [],
  }

  return NextResponse.json(stats)
}
