import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)

  const { data, error } = await supabase
    .from('client_intelligence')
    .select('*, opportunites:opportunites_ia(id, statut, ca_estime, titre, type)')
    .order('score_opportunite', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()
  const { organisation_nom, secteur, code_naf, idcc, idcc_libelle, effectif_tranche, services_souscrits, organisation_id, contact_id } = body

  if (!organisation_nom?.trim()) {
    return NextResponse.json({ error: 'organisation_nom requis' }, { status: 400 })
  }

  const validTranches = ['-11', '11-50', '50-250', '250+', null, undefined]
  if (!validTranches.includes(effectif_tranche)) {
    return NextResponse.json({ error: 'effectif_tranche invalide' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('client_intelligence')
    .insert({
      organisation_nom: organisation_nom.trim(),
      secteur: secteur ?? null,
      code_naf: code_naf ?? null,
      idcc: idcc ?? null,
      idcc_libelle: idcc_libelle ?? null,
      effectif_tranche: effectif_tranche ?? null,
      services_souscrits: Array.isArray(services_souscrits) ? services_souscrits : [],
      organisation_id: organisation_id ?? null,
      contact_id: contact_id ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
