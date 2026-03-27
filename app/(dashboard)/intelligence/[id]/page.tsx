import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Header from '@/components/layout/Header'
import ClientIntelligenceProfile from '@/components/intelligence/ClientIntelligenceProfile'
import type { Profile } from '@/lib/types'

export default async function ClientIntelligenceProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const [intelRes, oppsRes] = await Promise.all([
    supabase
      .from('client_intelligence')
      .select('*, prospect:prospects(id, company_name, sector, contacts(id, name, email, is_primary))')
      .eq('prospect_id', id)
      .single(),
    supabase
      .from('opportunites_ia')
      .select('*')
      .eq('prospect_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (intelRes.error || !intelRes.data) return notFound()

  return (
    <div className="flex flex-col h-full">
      <Header
        profile={profile as Profile}
        title={`Intelligence — ${intelRes.data.prospect?.company_name ?? 'Client'}`}
      />
      <ClientIntelligenceProfile
        intel={intelRes.data}
        opportunites={oppsRes.data ?? []}
        prospectId={id}
      />
    </div>
  )
}
