import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import ProspectsClient from '@/components/prospects/ProspectsClient'
import type { Profile } from '@/lib/types'

export default async function ProspectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { data: prospects } = await supabase
    .from('prospects')
    .select(`
      *,
      contacts(id, name, email, phone, is_primary),
      deals(id, stage, amount)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col h-full">
      <Header profile={profile as Profile} title="Prospects & Clients" />
      <ProspectsClient initialProspects={prospects || []} />
    </div>
  )
}
