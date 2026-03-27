import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateEmail, generateProposition } from '@/lib/intelligence/generator'
import type { ClientIntelligence, OpportuniteIA } from '@/lib/types'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { opportunite_id } = await request.json()
  if (!opportunite_id) return NextResponse.json({ error: 'opportunite_id requis' }, { status: 400 })

  const { data: opp, error: oppErr } = await supabase
    .from('opportunites_ia')
    .select('*')
    .eq('id', opportunite_id)
    .single()

  if (oppErr || !opp) return NextResponse.json({ error: 'Opportunité introuvable' }, { status: 404 })

  const { data: intel, error: intelErr } = await supabase
    .from('client_intelligence')
    .select('*, prospect:prospects(id, company_name, contacts(id, name, is_primary))')
    .eq('prospect_id', opp.prospect_id)
    .single()

  if (intelErr || !intel) return NextResponse.json({ error: 'Profil intelligence introuvable' }, { status: 404 })

  const prospect = intel.prospect as { company_name: string; contacts?: Array<{ name: string; is_primary: boolean }> }
  const nomClient = prospect?.company_name ?? 'Client'
  const contactPrimaire = prospect?.contacts?.find((c: { is_primary: boolean }) => c.is_primary)
  const nomContact = contactPrimaire?.name

  const opportunite = opp as OpportuniteIA
  const clientIntel = intel as ClientIntelligence

  const email = generateEmail(clientIntel, opportunite, nomClient, nomContact)
  const proposition = generateProposition(clientIntel, opportunite, nomClient)

  const emailText = `Sujet : ${email.sujet}\n\n${email.corps}`
  const propositionText = JSON.stringify(proposition, null, 2)

  await supabase
    .from('opportunites_ia')
    .update({
      email_genere: emailText,
      proposition_generee: propositionText,
      statut: opp.statut === 'nouvelle' ? 'en_cours' : opp.statut,
      updated_at: new Date().toISOString(),
    })
    .eq('id', opportunite_id)

  return NextResponse.json({ email, proposition })
}
