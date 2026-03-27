import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params

  const [intelRes, oppsRes] = await Promise.all([
    supabase
      .from('client_intelligence')
      .select('*, prospect:prospects(id, company_name, sector, size, score, contacts(id, name, email, is_primary))')
      .eq('prospect_id', id)
      .single(),
    supabase
      .from('opportunites_ia')
      .select('*')
      .eq('prospect_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (intelRes.error) return NextResponse.json({ error: intelRes.error.message }, { status: 404 })
  return NextResponse.json({ intel: intelRes.data, opportunites: oppsRes.data ?? [] })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const { data, error } = await supabase
    .from('client_intelligence')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('prospect_id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
