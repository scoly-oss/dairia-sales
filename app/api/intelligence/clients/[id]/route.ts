import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params

  const { data: ci, error } = await supabase
    .from('client_intelligence')
    .select('*, prospect:prospects(*)')
    .eq('prospect_id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  // Récupérer les opportunités du client
  const { data: opportunites } = await supabase
    .from('opportunites_ia')
    .select('*')
    .eq('prospect_id', id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ ...ci, opportunites: opportunites ?? [] })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const { data, error } = await supabase
    .from('client_intelligence')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('prospect_id', id)
    .select('*, prospect:prospects(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
