import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import IntelligenceClient from '@/components/intelligence/IntelligenceClient'
import type { Profile } from '@/lib/types'

export default async function IntelligencePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { data: clients } = await supabase
    .from('client_intelligence')
    .select('*, prospect:prospects(*)')
    .order('score_opportunite', { ascending: false })

  const { data: opportunites } = await supabase
    .from('opportunites_ia')
    .select('*, prospect:prospects(company_name)')
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: actus } = await supabase
    .from('actu_impacts')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col h-full">
      <Header profile={profile as Profile} title="Intelligence Client" />
      <IntelligenceClient
        initialClients={clients ?? []}
        initialOpportunites={opportunites ?? []}
        initialActus={actus ?? []}
      />
    </div>
  )
}
