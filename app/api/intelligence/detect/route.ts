import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { detectOpportunites, calculateScore } from '@/lib/intelligence/engine'
import type { ClientIntelligence, Prospect, ActuImpact, OpportuniteIA } from '@/lib/types'

// POST /api/intelligence/detect — lance la détection pour un ou tous les clients
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const prospectId: string | null = body.prospect_id || null

  // Charger les actualités
  const { data: actus } = await supabase
    .from('actu_impacts')
    .select('*')
    .order('created_at', { ascending: false })

  // Charger les profils intelligence (tous ou un seul)
  let profilesQuery = supabase
    .from('client_intelligence')
    .select('*, prospect:prospects(id, company_name, siren, sector, size, score, tags)')

  if (prospectId) profilesQuery = profilesQuery.eq('prospect_id', prospectId)

  const { data: profiles } = await profilesQuery

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ created: 0, updated: 0 })
  }

  const currentMonth = new Date().getMonth() + 1
  let created = 0
  let updated = 0

  for (const profile of profiles) {
    const client = profile as ClientIntelligence & { prospect: Prospect }
    if (!client.prospect) continue

    // Opportunités existantes pour ce client
    const { data: existing } = await supabase
      .from('opportunites_ia')
      .select('source, service_propose, statut, ca_estime')
      .eq('prospect_id', client.prospect_id)

    const existingOpps = (existing || []) as Pick<
      OpportuniteIA,
      'source' | 'service_propose' | 'statut' | 'ca_estime'
    >[]

    // Détection
    const newOpps = detectOpportunites(
      client,
      client.prospect,
      (actus || []) as ActuImpact[],
      currentMonth,
      existingOpps
    )

    // Insertion des nouvelles opportunités
    if (newOpps.length > 0) {
      const { error } = await supabase.from('opportunites_ia').insert(newOpps)
      if (!error) created += newOpps.length
    }

    // Mise à jour du score
    const allOpps = [...existingOpps, ...newOpps.map((o) => ({ ...o, ca_estime: o.ca_estime || 0 }))]
    const newScore = calculateScore(client, allOpps)

    await supabase
      .from('client_intelligence')
      .update({ score_opportunite: newScore, updated_at: new Date().toISOString() })
      .eq('prospect_id', client.prospect_id)

    updated++
  }

  return NextResponse.json({ created, updated })
}
