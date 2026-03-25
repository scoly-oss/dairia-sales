import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/intelligence/actu — liste des actualités juridiques
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data, error } = await supabase
    .from('actu_impacts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

// POST /api/intelligence/actu — créer une actualité
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()

  const required = ['source_type', 'source_ref', 'titre', 'resume']
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `Champ requis : ${field}` }, { status: 400 })
    }
  }

  const { data, error } = await supabase
    .from('actu_impacts')
    .insert({
      source_type: body.source_type,
      source_ref: body.source_ref,
      titre: body.titre,
      resume: body.resume,
      clients_concernes_ids: body.clients_concernes_ids || [],
      services_concernes: body.services_concernes || [],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
