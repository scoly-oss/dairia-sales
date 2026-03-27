import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data, error } = await supabase
    .from('actu_impacts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()

  // Validation basique
  if (!body.titre || !body.resume || !body.source_type) {
    return NextResponse.json(
      { error: 'Champs obligatoires manquants : titre, resume, source_type' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('actu_impacts')
    .insert({
      source_type: body.source_type,
      source_ref: body.source_ref ?? null,
      titre: body.titre,
      resume: body.resume,
      clients_concernes_ids: body.clients_concernes_ids ?? [],
      services_concernes: body.services_concernes ?? [],
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
