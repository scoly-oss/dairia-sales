import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { genererEmail, genererProposition } from '@/lib/intelligence/generator'
import type { ClientIntelligence, OpportuniteIA } from '@/lib/types'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()
  const { opportunite_id } = body

  if (!opportunite_id) {
    return NextResponse.json({ error: 'opportunite_id requis' }, { status: 400 })
  }

  // Récupérer l'opportunité
  const { data: opp, error: oppError } = await supabase
    .from('opportunites_ia')
    .select('*')
    .eq('id', opportunite_id)
    .single()

  if (oppError || !opp) {
    return NextResponse.json({ error: 'Opportunité non trouvée' }, { status: 404 })
  }

  // Récupérer le profil intelligence du client
  const { data: ci, error: ciError } = await supabase
    .from('client_intelligence')
    .select('*, prospect:prospects(*)')
    .eq('prospect_id', opp.prospect_id)
    .single()

  if (ciError || !ci) {
    return NextResponse.json({ error: 'Profil client non trouvé' }, { status: 404 })
  }

  const email = genererEmail(ci as ClientIntelligence, opp as OpportuniteIA)
  const proposition = genererProposition(ci as ClientIntelligence, opp as OpportuniteIA)

  // Sauvegarder les contenus générés dans l'opportunité
  const emailTexte = `Sujet : ${email.sujet}\n\n${email.corps}`
  const propositionTexte = JSON.stringify(proposition, null, 2)

  await supabase
    .from('opportunites_ia')
    .update({
      email_genere: emailTexte,
      proposition_generee: propositionTexte,
      statut: opp.statut === 'detectee' ? 'en_cours' : opp.statut,
    })
    .eq('id', opportunite_id)

  return NextResponse.json({ email, proposition })
}
