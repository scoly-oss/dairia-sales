import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Header from '@/components/layout/Header'
import ClientIntelligenceProfile from '@/components/intelligence/ClientIntelligenceProfile'

export default async function ClientIntelligencePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { data: client, error } = await supabase
    .from('client_intelligence')
    .select('*, opportunites:opportunites_ia(*, actu:actu_impacts(titre, source_ref, source_type))')
    .eq('id', id)
    .single()

  if (error || !client) notFound()

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header profile={profile} title={client.organisation_nom} />
      <main className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: '#f8f8f6' }}>
        <ClientIntelligenceProfile client={client} />
      </main>
    </div>
  )
}
