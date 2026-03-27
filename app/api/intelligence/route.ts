import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [opps, actus] = await Promise.all([
    supabase.from('opportunites_ia').select('*').order('created_at', { ascending: false }),
    supabase.from('actu_impacts').select('*').order('created_at', { ascending: false }).limit(5),
  ])

  const opportunites = opps.data ?? []
  const actusData = actus.data ?? []

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

  return NextResponse.json({
    stats: {
      total_opportunites: actives.length,
      ca_potentiel: caPotentiel,
      clients_avec_opportunites: clientsIds.size,
      nouvelles_cette_semaine: nouvellesSemaine,
      taux_conversion: tauxConversion,
      opportunites_par_statut: statutMap,
    },
    opportunites_recentes: opportunites.slice(0, 10),
    actus_recentes: actusData,
  })
}
