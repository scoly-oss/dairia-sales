import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateEmail, generateProposition } from '@/lib/intelligence/generator'
import type { ClientIntelligence, OpportuniteIA, ActuImpact } from '@/lib/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()
  const { opportunite_id } = body

  if (!opportunite_id) {
    return NextResponse.json({ error: 'opportunite_id requis' }, { status: 400 })
  }

  // Charger l'opportunité avec son client et son actu
  const { data: opp, error: oppError } = await supabase
    .from('opportunites_ia')
    .select('*, client:client_intelligence(*), actu:actu_impacts(*)')
    .eq('id', opportunite_id)
    .single()

  if (oppError || !opp) {
    return NextResponse.json({ error: 'Opportunité non trouvée' }, { status: 404 })
  }

  const opportunite = opp as OpportuniteIA & { client: ClientIntelligence; actu: ActuImpact | null }
  const client = opportunite.client
  if (!client) {
    return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 })
  }

  // Générer email et proposition
  const email = generateEmail(client, opportunite, opportunite.actu)
  const proposition = generateProposition(client, opportunite)

  // Sauvegarder dans la DB
  const emailText = `**Sujet :** ${email.sujet}\n\n${email.corps}`
  const propositionText = [
    `**${proposition.titre}**\n`,
    `**Livrables :**`,
    ...proposition.livrables.map((l) => `• ${l}`),
    `\n**Calendrier :** ${proposition.calendrier}`,
    `\n**Budget :**`,
    `• HT : ${proposition.budget_ht.toLocaleString('fr-FR')} €`,
    `• TVA (20%) : ${proposition.tva.toLocaleString('fr-FR')} €`,
    `• TTC : ${proposition.budget_ttc.toLocaleString('fr-FR')} €`,
    `\n**Validité :** ${proposition.validite}`,
    `\n**Conditions :** ${proposition.conditions}`,
  ].join('\n')

  const { error: updateError } = await supabase
    .from('opportunites_ia')
    .update({
      email_genere: emailText,
      proposition_generee: propositionText,
      updated_at: new Date().toISOString(),
    })
    .eq('id', opportunite_id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ email, proposition, email_text: emailText, proposition_text: propositionText })
}
