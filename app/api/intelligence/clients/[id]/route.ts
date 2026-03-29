import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const { data, error } = await supabase
    .from('client_intelligence')
    .select('*, opportunites:opportunites_ia(*, actu:actu_impacts(*))')
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { organisation_nom, secteur, code_naf, idcc, idcc_libelle, effectif_tranche, services_souscrits, score_opportunite } = body

  const validTranches = ['-11', '11-50', '50-250', '250+', null, undefined]
  if (effectif_tranche !== undefined && !validTranches.includes(effectif_tranche)) {
    return NextResponse.json({ error: 'effectif_tranche invalide' }, { status: 400 })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (organisation_nom !== undefined) updates.organisation_nom = organisation_nom
  if (secteur !== undefined) updates.secteur = secteur
  if (code_naf !== undefined) updates.code_naf = code_naf
  if (idcc !== undefined) updates.idcc = idcc
  if (idcc_libelle !== undefined) updates.idcc_libelle = idcc_libelle
  if (effectif_tranche !== undefined) updates.effectif_tranche = effectif_tranche
  if (services_souscrits !== undefined) updates.services_souscrits = services_souscrits
  if (score_opportunite !== undefined) updates.score_opportunite = Math.min(100, Math.max(0, score_opportunite))

  const { data, error } = await supabase
    .from('client_intelligence')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
