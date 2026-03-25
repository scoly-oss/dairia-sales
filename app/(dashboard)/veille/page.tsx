import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import VeilleClient from '@/components/veille/VeilleClient'
import type { Profile } from '@/lib/types'

export default async function VeillePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { data: alertes } = await supabase
    .from('veille_alertes')
    .select('*')
    .eq('archive', false)
    .order('created_at', { ascending: false })

  const { data: concurrents } = await supabase
    .from('veille_concurrents')
    .select('*')
    .order('nom', { ascending: true })

  const { data: config } = await supabase
    .from('veille_config')
    .select('*')
    .single()

  return (
    <div className="flex flex-col h-full">
      <Header profile={profile as Profile} title="Veille Stratégique" />
      <VeilleClient
        initialAlertes={alertes || []}
        initialConcurrents={concurrents || []}
        initialConfig={config || null}
      />
    </div>
  )
}
