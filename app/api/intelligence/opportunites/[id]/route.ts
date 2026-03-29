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
    .from('opportunites_ia')
    .select('*, client:client_intelligence(*), actu:actu_impacts(*)')
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Opportunité non trouvée' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { statut, email_genere, proposition_generee } = body

  const validStatuts = ['nouvelle', 'en_cours', 'gagnee', 'perdue', 'ignoree']
  if (statut && !validStatuts.includes(statut)) {
    return NextResponse.json({ error: 'statut invalide' }, { status: 400 })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (statut !== undefined) updates.statut = statut
  if (email_genere !== undefined) updates.email_genere = email_genere
  if (proposition_generee !== undefined) updates.proposition_generee = proposition_generee

  const { data, error } = await supabase
    .from('opportunites_ia')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const { error } = await supabase.from('opportunites_ia').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
