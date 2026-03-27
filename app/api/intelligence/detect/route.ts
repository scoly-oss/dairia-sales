import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { detectOpportunitiesForClient, computeScoreOpportunite } from '@/lib/intelligence/engine'
import type { ClientIntelligence, OpportuniteIA } from '@/lib/types'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()
  const { prospect_id } = body

  let clients: ClientIntelligence[] = []

  if (prospect_id) {
    const { data } = await supabase
      .from('client_intelligence')
      .select('*')
      .eq('prospect_id', prospect_id)
    clients = data ?? []
  } else {
    const { data } = await supabase.from('client_intelligence').select('*')
    clients = data ?? []
  }

  let totalCreated = 0

  for (const intel of clients) {
    const { data: existing } = await supabase
      .from('opportunites_ia')
      .select('*')
      .eq('prospect_id', intel.prospect_id)

    const existingOpps: OpportuniteIA[] = existing ?? []
    const nouvelles = detectOpportunitiesForClient(intel, existingOpps)

    for (const opp of nouvelles) {
      await supabase.from('opportunites_ia').insert({
        prospect_id: intel.prospect_id,
        ...opp,
        statut: 'nouvelle',
      })
      totalCreated++
    }

    // Recalcul du score
    const { data: allOpps } = await supabase
      .from('opportunites_ia')
      .select('*')
      .eq('prospect_id', intel.prospect_id)

    const score = computeScoreOpportunite(allOpps ?? [])
    await supabase
      .from('client_intelligence')
      .update({ score_opportunite: score, updated_at: new Date().toISOString() })
      .eq('prospect_id', intel.prospect_id)
  }

  return NextResponse.json({
    clients_analyses: clients.length,
    opportunites_creees: totalCreated,
  })
}
