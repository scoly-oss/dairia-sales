import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const statut = searchParams.get('statut')
  const clientId = searchParams.get('client_id')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)

  let query = supabase
    .from('opportunites_ia')
    .select('*, client:client_intelligence(id, organisation_nom, secteur, effectif_tranche), actu:actu_impacts(titre, source_ref)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (statut) query = query.eq('statut', statut)
  if (clientId) query = query.eq('client_intelligence_id', clientId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()
  const { client_intelligence_id, type, source, titre, description, service_propose, ca_estime, statut, actu_id } = body

  if (!client_intelligence_id || !type || !titre) {
    return NextResponse.json({ error: 'client_intelligence_id, type et titre sont requis' }, { status: 400 })
  }

  const validTypes = ['services_manquants', 'saisonnalite', 'actu_juridique']
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: 'type invalide' }, { status: 400 })
  }

  // Récupérer le nom de l'organisation
  const { data: ci } = await supabase
    .from('client_intelligence')
    .select('organisation_nom, organisation_id')
    .eq('id', client_intelligence_id)
    .single()

  const { data, error } = await supabase
    .from('opportunites_ia')
    .insert({
      client_intelligence_id,
      organisation_id: ci?.organisation_id ?? null,
      organisation_nom: ci?.organisation_nom ?? null,
      type,
      source: source ?? null,
      titre: titre.trim(),
      description: description ?? null,
      service_propose: service_propose ?? null,
      ca_estime: ca_estime ?? 0,
      statut: statut ?? 'nouvelle',
      actu_id: actu_id ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
