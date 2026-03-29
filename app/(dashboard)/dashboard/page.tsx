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
      sub: 'deals pondérés',
      color: '#e8842c',
      bg: 'rgba(232,132,44,0.08)',
      dot: '#e8842c',
    },
    {
      label: 'CA Réalisé (mois)',
      value: formatCurrency(caRealiseMonth),
      sub: 'mois en cours',
      color: '#10b981',
      bg: 'rgba(16,185,129,0.08)',
      dot: '#10b981',
    },
    {
      label: 'CA Réalisé (trim.)',
      value: formatCurrency(caRealiseQ),
      sub: 'trimestre en cours',
      color: '#3b82f6',
      bg: 'rgba(59,130,246,0.08)',
      dot: '#3b82f6',
    },
    {
      label: 'Taux de conversion',
      value: `${tauxConversion}%`,
      sub: `${wonCount?.length || 0} deals gagnés`,
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.08)',
      dot: '#8b5cf6',
    },
    {
      label: 'Deals actifs',
      value: `${allDeals.length}`,
      sub: 'pipeline en cours',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.08)',
      dot: '#f59e0b',
    },
    {
      label: 'Nouveaux prospects',
      value: `${newProspects?.length || 0}`,
      sub: '7 derniers jours',
      color: '#ec4899',
      bg: 'rgba(236,72,153,0.08)',
      dot: '#ec4899',
    },
  ]

  return (
    <div className="flex flex-col h-full">
      <Header profile={profile as Profile} title="Dashboard" />
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[14px] p-4"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e5e3',
                boxShadow: '0 1px 4px rgba(30,45,61,0.06)',
              }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: stat.dot }}
                />
                <p className="text-xs font-medium leading-tight" style={{ color: '#6b7280' }}>
                  {stat.label}
                </p>
              </div>
              <p className="text-xl sm:text-2xl font-bold leading-none" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="text-xs mt-1.5" style={{ color: '#9ca3af' }}>
                {stat.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Charts + Top deals */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          <div className="xl:col-span-2">
            <DashboardCharts />
          </div>

          {/* Top 5 deals */}
          <div
            className="rounded-[14px] p-5"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e5e3',
              boxShadow: '0 1px 4px rgba(30,45,61,0.06)',
            }}
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
        <div className="mt-4 sm:mt-6">
          <VeilleWidget alertes={(veilleAlertes || []) as VeilleAlerte[]} nonLuCount={veilleNonLu} />
        </div>

        {/* CA Annuel */}
        <div
          className="mt-4 p-5 rounded-[14px] flex items-center justify-between"
          style={{ backgroundColor: '#1e2d3d' }}
        >
          <div>
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
              CA Réalisé — Année {now.getFullYear()}
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-white mt-1">
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
