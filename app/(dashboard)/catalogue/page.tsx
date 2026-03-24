import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import CatalogueClient from '@/components/catalogue/CatalogueClient'
import type { Profile } from '@/lib/types'

export default async function CataloguePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
  const { data: services } = await supabase.from('services').select('*').order('category').order('name')

  return (
    <div className="flex flex-col h-full">
      <Header profile={profile as Profile} title="Catalogue de prestations" />
      <CatalogueClient initialServices={services || []} />
    </div>
  )
}
