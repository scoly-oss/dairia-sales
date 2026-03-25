import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateEmail, generateProposition } from '@/lib/intelligence/generator'
import type { OpportuniteIA, Prospect, ClientIntelligence } from '@/lib/types'

// POST /api/intelligence/generate — génère email et proposition pour une opportunité
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const { opportunite_id } = body

  if (!opportunite_id) {
    return NextResponse.json({ error: 'opportunite_id requis' }, { status: 400 })
  }

  // Charger l'opportunité
  const { data: opp, error: oppError } = await supabase
    .from('opportunites_ia')
    .select('*')
    .eq('id', opportunite_id)
    .single()

  if (oppError || !opp) {
    return NextResponse.json({ error: 'Opportunité introuvable' }, { status: 404 })
  }

  // Charger le prospect
  const { data: prospect, error: prospectError } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', opp.prospect_id)
    .single()

  if (prospectError || !prospect) {
    return NextResponse.json({ error: 'Prospect introuvable' }, { status: 404 })
  }

  // Charger le profil intelligence
  const { data: intel, error: intelError } = await supabase
    .from('client_intelligence')
    .select('*')
    .eq('prospect_id', opp.prospect_id)
    .single()

  if (intelError || !intel) {
    return NextResponse.json({ error: 'Profil intelligence introuvable' }, { status: 404 })
  }

  const email = generateEmail(opp as OpportuniteIA, prospect as Prospect, intel as ClientIntelligence)
  const proposition = generateProposition(
    opp as OpportuniteIA,
    prospect as Prospect,
    intel as ClientIntelligence
  )

  // Sauvegarder dans l'opportunité
  await supabase
    .from('opportunites_ia')
    .update({ email_genere: email, proposition_generee: proposition, statut: 'vue' })
    .eq('id', opportunite_id)

  return NextResponse.json({ email, proposition })
}
