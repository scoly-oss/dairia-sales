import { NextRequest, NextResponse } from 'next/server'
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
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await request.json()
  const { source_type, source_ref, titre, resume, clients_concernes_ids, services_concernes } = body

  if (!source_type || !titre) {
    return NextResponse.json({ error: 'source_type et titre sont requis' }, { status: 400 })
  }

  const validTypes = ['decret', 'jurisprudence', 'reforme', 'ccn', 'loi']
  if (!validTypes.includes(source_type)) {
    return NextResponse.json({ error: 'source_type invalide' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('actu_impacts')
    .insert({
      source_type,
      source_ref: source_ref ?? null,
      titre: titre.trim(),
      resume: resume ?? null,
      clients_concernes_ids: Array.isArray(clients_concernes_ids) ? clients_concernes_ids : [],
      services_concernes: Array.isArray(services_concernes) ? services_concernes : [],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
