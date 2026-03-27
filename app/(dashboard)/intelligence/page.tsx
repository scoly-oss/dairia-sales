import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import IntelligenceClient from '@/components/intelligence/IntelligenceClient'
import type { Profile, IaProposal } from '@/lib/types'

export default async function IntelligencePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { data: proposals } = await supabase
    .from('ia_proposals')
    .select(`
      *,
      prospect:prospects(id, company_name),
      deal:deals(id, title)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#f8f8f6' }}>
      <Header profile={profile as Profile} title="Intelligence IA" />
      <div className="flex-1 overflow-y-auto">
        <IntelligenceClient initialProposals={(proposals as IaProposal[]) || []} />
      </div>
    </div>
  )
}
