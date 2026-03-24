import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import EmailsClient from '@/components/emails/EmailsClient'
import type { Profile } from '@/lib/types'

export default async function EmailsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
  const { data: templates } = await supabase.from('email_templates').select('*').order('category').order('name')
  const { data: sentEmails } = await supabase
    .from('emails_sent')
    .select('*, prospect:prospects(company_name)')
    .order('sent_at', { ascending: false })
    .limit(50)
  const { data: prospects } = await supabase.from('prospects').select('id, company_name').order('company_name')

  return (
    <div className="flex flex-col h-full">
      <Header profile={profile as Profile} title="Emails & Communication" />
      <EmailsClient
        initialTemplates={templates || []}
        initialSentEmails={sentEmails || []}
        prospects={prospects || []}
        currentUser={profile as Profile}
      />
    </div>
  )
}
