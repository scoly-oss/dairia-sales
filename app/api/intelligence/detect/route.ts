import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { detectOpportunites, calculateScore } from '@/lib/intelligence/engine'
import type { ClientIntelligence, OpportuniteIA, ActuImpact } from '@/lib/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()
  const { client_id } = body // optionnel : si absent, on détecte pour tous les clients

  // Charger les actus
  const { data: actus } = await supabase.from('actu_impacts').select('*')
  const actusData: ActuImpact[] = actus ?? []

  // Charger les clients
  let clientsQuery = supabase.from('client_intelligence').select('*')
  if (client_id) clientsQuery = clientsQuery.eq('id', client_id)
  const { data: clients } = await clientsQuery

  if (!clients || clients.length === 0) {
    return NextResponse.json({ message: 'Aucun client trouvé', created: 0 })
  }

  // Charger toutes les opportunités existantes
  const { data: allExistingOpps } = await supabase.from('opportunites_ia').select('*')
  const existingOpps: OpportuniteIA[] = allExistingOpps ?? []

  let totalCreated = 0
  const results: { client_id: string; organisation_nom: string; created: number }[] = []

  for (const client of clients as ClientIntelligence[]) {
    const clientOpps = existingOpps.filter((o) => o.client_intelligence_id === client.id)
    const newOpps = detectOpportunites(client, clientOpps, actusData)

    if (newOpps.length > 0) {
      const toInsert = newOpps.map((opp) => ({
        client_intelligence_id: client.id,
        organisation_id: client.organisation_id ?? null,
        organisation_nom: client.organisation_nom,
        type: opp.type,
        source: opp.source,
        titre: opp.titre,
        description: opp.description,
        service_propose: opp.service_propose,
        ca_estime: opp.ca_estime,
        statut: 'nouvelle',
        actu_id: opp.actu_id ?? null,
      }))

      const { data: inserted } = await supabase.from('opportunites_ia').insert(toInsert).select()
      const insertedCount = inserted?.length ?? 0
      totalCreated += insertedCount

      // Recalculer le score
      const updatedOpps = [...existingOpps, ...(inserted ?? [])]
      const newScore = calculateScore(client, updatedOpps, [])
      await supabase
        .from('client_intelligence')
        .update({ score_opportunite: newScore, updated_at: new Date().toISOString() })
        .eq('id', client.id)

      results.push({ client_id: client.id, organisation_nom: client.organisation_nom, created: insertedCount })
    }
  }

  return NextResponse.json({ message: `${totalCreated} opportunité(s) créée(s)`, created: totalCreated, results })
}
