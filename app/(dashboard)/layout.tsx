import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import { SidebarProvider } from '@/components/layout/SidebarContext'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Ensure profile exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || null,
      role: 'commercial',
    })
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#f8f8f6' }}>
        <Sidebar />
        <main className="flex-1 lg:ml-60 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
