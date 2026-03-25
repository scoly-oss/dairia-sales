import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/intelligence/clients — liste des profils intelligence
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { data, error } = await supabase
    .from('client_intelligence')
    .select('*, prospect:prospects(id, company_name, siren, sector, score)')
    .order('score_opportunite', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
