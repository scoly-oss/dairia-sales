import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/intelligence/opportunites — liste des opportunités
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const url = new URL(req.url)
  const prospectId = url.searchParams.get('prospect_id')
  const statut = url.searchParams.get('statut')

  let query = supabase
    .from('opportunites_ia')
    .select('*, prospect:prospects(id, company_name, sector)')
    .order('created_at', { ascending: false })

  if (prospectId) query = query.eq('prospect_id', prospectId)
  if (statut) query = query.eq('statut', statut)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

// POST /api/intelligence/opportunites — créer une opportunité
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()

  const required = ['prospect_id', 'type', 'source', 'titre', 'description', 'service_propose']
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `Champ requis : ${field}` }, { status: 400 })
    }
  }

  const { data, error } = await supabase
    .from('opportunites_ia')
    .insert({
      prospect_id: body.prospect_id,
      type: body.type,
      source: body.source,
      titre: body.titre,
      description: body.description,
      service_propose: body.service_propose,
      ca_estime: body.ca_estime || 0,
      statut: 'nouvelle',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
