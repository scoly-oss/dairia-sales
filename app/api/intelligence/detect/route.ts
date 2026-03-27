import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { detecterOpportunites, calculerScore } from '@/lib/intelligence/engine'
import type { ClientIntelligence, OpportuniteIA } from '@/lib/types'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()
  const prospectId: string | null = body.prospect_id ?? null

  // Récupérer les profils clients à analyser
  let ciQuery = supabase
    .from('client_intelligence')
    .select('*, prospect:prospects(*)')

  if (prospectId) {
    ciQuery = ciQuery.eq('prospect_id', prospectId)
  }

  const { data: clients, error: ciError } = await ciQuery
  if (ciError) return NextResponse.json({ error: ciError.message }, { status: 500 })

  const resultats: {
    prospect_id: string
    nouveautés: number
    score: number
  }[] = []

  for (const ci of clients ?? []) {
    // Opportunités existantes pour ce client
    const { data: existantes } = await supabase
      .from('opportunites_ia')
      .select('*')
      .eq('prospect_id', ci.prospect_id)

    const opportunitesExistantes: OpportuniteIA[] = existantes ?? []

    // Détecter les nouvelles opportunités
    const candidats = detecterOpportunites(ci as ClientIntelligence, opportunitesExistantes)

    // Persister les nouvelles opportunités
    for (const candidat of candidats) {
      await supabase.from('opportunites_ia').insert({
        prospect_id: ci.prospect_id,
        type: candidat.type,
        source: candidat.source,
        titre: candidat.titre,
        description: candidat.description,
        service_propose: candidat.service_propose,
        ca_estime: candidat.ca_estime,
        statut: 'detectee',
      })
    }

    // Recalculer le score
    const toutesLesOpps = [
      ...opportunitesExistantes,
      ...candidats.map((c) => ({
        ...c,
        id: '',
        prospect_id: ci.prospect_id,
        statut: 'detectee' as const,
        email_genere: null,
        proposition_generee: null,
        created_at: new Date().toISOString(),
      })),
    ]
    const score = calculerScore(ci as ClientIntelligence, toutesLesOpps)

    await supabase
      .from('client_intelligence')
      .update({ score_opportunite: score, updated_at: new Date().toISOString() })
      .eq('prospect_id', ci.prospect_id)

    resultats.push({
      prospect_id: ci.prospect_id,
      nouveautés: candidats.length,
      score,
    })
  }

  return NextResponse.json({
    ok: true,
    clients_analyses: resultats.length,
    resultats,
  })
}
