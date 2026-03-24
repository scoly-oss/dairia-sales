import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import ParametresClient from '@/components/parametres/ParametresClient'
import type { Profile } from '@/lib/types'

export default async function ParametresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
  const { data: allProfiles } = await supabase.from('profiles').select('*').order('name')
  const { data: prospects } = await supabase.from('prospects').select('*').order('company_name')

  return (
    <div className="flex flex-col h-full">
      <Header profile={profile as Profile} title="Paramètres" />
      <ParametresClient
        currentUser={profile as Profile}
        allProfiles={allProfiles as Profile[] || []}
        prospects={prospects || []}
      />
    </div>
  )
}
