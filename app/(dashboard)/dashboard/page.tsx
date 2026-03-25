import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/Header'
import DashboardCharts from '@/components/dashboard/DashboardCharts'
import VeilleWidget from '@/components/dashboard/VeilleWidget'
import { formatCurrency, stageLabel } from '@/lib/utils'
import type { Profile, Deal, VeilleAlerte } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  // Stats deals
  const { data: deals } = await supabase
    .from('deals')
    .select('*, prospect:prospects(company_name)')
    .not('stage', 'in', '("perdu")')
    .order('amount', { ascending: false })

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString()
  const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString()
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: wonDeals } = await supabase
    .from('deals')
    .select('amount, closed_at')
    .eq('stage', 'gagne')

  const { data: newProspects } = await supabase
    .from('prospects')
    .select('id')
    .gte('created_at', startOfWeek)

  const allDeals = deals || []
  const allWon = wonDeals || []

  const caPrevisionnel = allDeals.reduce((sum, d) => sum + (d.amount * d.probability) / 100, 0)
  const caRealise = allWon.filter((d) => d.closed_at).reduce((sum, d) => sum + d.amount, 0)
  const caRealiseMonth = allWon.filter((d) => d.closed_at >= startOfMonth).reduce((sum, d) => sum + d.amount, 0)
  const caRealiseQ = allWon.filter((d) => d.closed_at >= startOfQuarter).reduce((sum, d) => sum + d.amount, 0)
  const caRealiseYear = allWon.filter((d) => d.closed_at >= startOfYear).reduce((sum, d) => sum + d.amount, 0)

  const { data: prospectCount } = await supabase.from('prospects').select('id', { count: 'exact', head: true })
  const { data: wonCount } = await supabase.from('deals').select('id', { count: 'exact', head: true }).eq('stage', 'gagne')
  const { data: totalDeals } = await supabase.from('deals').select('id', { count: 'exact', head: true })

  const tauxConversion = totalDeals?.length
    ? Math.round(((wonCount?.length || 0) / (totalDeals?.length || 1)) * 100)
    : 0

  const top5 = allDeals.slice(0, 5)

  // Veille widget
  const { data: veilleAlertes } = await supabase
    .from('veille_alertes')
    .select('*')
    .eq('archive', false)
    .order('created_at', { ascending: false })
    .limit(5)

  const veilleNonLu = (veilleAlertes || []).filter((a) => !a.lu).length

  const stats = [
    {
      label: 'CA Prévisionnel',
      value: formatCurrency(caPrevisionnel),
      sub: 'deals en cours pondérés',
      color: '#e8842c',
      bg: '#fff7ed',
    },
    {
      label: 'CA Réalisé (mois)',
      value: formatCurrency(caRealiseMonth),
      sub: 'mois en cours',
      color: '#10b981',
      bg: '#ecfdf5',
    },
    {
      label: 'CA Réalisé (trimestre)',
      value: formatCurrency(caRealiseQ),
      sub: 'trimestre en cours',
      color: '#3b82f6',
      bg: '#eff6ff',
    },
    {
      label: 'Taux de conversion',
      value: `${tauxConversion}%`,
      sub: `${wonCount?.length || 0} deals gagnés`,
      color: '#8b5cf6',
      bg: '#f5f3ff',
    },
    {
      label: 'Deals actifs',
      value: `${allDeals.length}`,
      sub: 'pipeline en cours',
      color: '#f59e0b',
      bg: '#fffbeb',
    },
    {
      label: 'Nouveaux prospects',
      value: `${newProspects?.length || 0}`,
      sub: '7 derniers jours',
      color: '#ec4899',
      bg: '#fdf2f8',
    },
  ]

  return (
    <div className="flex flex-col h-full">
      <Header profile={profile as Profile} title="Dashboard" />
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl p-4"
              style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
            >
              <p className="text-xs font-medium mb-1" style={{ color: '#6b7280' }}>
                {stat.label}
              </p>
              <p className="text-2xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
                {stat.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Charts + Top deals */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <DashboardCharts />
          </div>

          {/* Top 5 deals */}
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
          >
            <h2 className="font-semibold text-sm mb-4" style={{ color: '#1e2d3d' }}>
              Top 5 deals en cours
            </h2>
            {top5.length === 0 ? (
              <p className="text-sm" style={{ color: '#6b7280' }}>
                Aucun deal actif.
              </p>
            ) : (
              <div className="space-y-3">
                {top5.map((deal, i) => (
                  <div key={deal.id} className="flex items-start gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: i === 0 ? '#e8842c' : '#6b7280' }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#1e2d3d' }}>
                        {deal.title}
                      </p>
                      <p className="text-xs" style={{ color: '#6b7280' }}>
                        {(deal as Deal & { prospect?: { company_name: string } }).prospect?.company_name || '—'} ·{' '}
                        {stageLabel(deal.stage)}
                      </p>
                    </div>
                    <div className="text-sm font-semibold flex-shrink-0" style={{ color: '#e8842c' }}>
                      {formatCurrency(deal.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Veille widget */}
        <div className="mt-6">
          <VeilleWidget alertes={(veilleAlertes || []) as VeilleAlerte[]} nonLuCount={veilleNonLu} />
        </div>

        {/* CA Annuel */}
        <div className="mt-4 p-5 rounded-xl flex items-center justify-between"
          style={{ backgroundColor: '#1e2d3d' }}>
          <div>
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
              CA Réalisé — Année {now.getFullYear()}
            </p>
            <p className="text-3xl font-bold text-white mt-1">
              {formatCurrency(caRealiseYear)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Total prospects</p>
            <p className="text-2xl font-bold" style={{ color: '#e8842c' }}>
              {prospectCount?.length || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
