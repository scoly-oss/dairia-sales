'use client'

import { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

const STAGE_COLORS: Record<string, string> = {
  prospect: '#6b7280',
  qualification: '#8b5cf6',
  proposition: '#e8842c',
  negociation: '#f59e0b',
  gagne: '#10b981',
  perdu: '#ef4444',
}

const SOURCE_COLORS = ['#e8842c', '#1e2d3d', '#10b981', '#8b5cf6', '#f59e0b', '#6b7280']

export default function DashboardCharts() {
  const [pipeline, setPipeline] = useState<Array<{ name: string; deals: number; montant: number }>>([])
  const [sources, setSources] = useState<Array<{ name: string; value: number }>>([])
  const [caEvolution, setCaEvolution] = useState<Array<{ mois: string; ca: number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()

      const { data: deals } = await supabase
        .from('deals')
        .select('stage, amount, source, closed_at, created_at')

      if (!deals) {
        setLoading(false)
        return
      }

      // Pipeline funnel
      const stageOrder = ['prospect', 'qualification', 'proposition', 'negociation', 'gagne', 'perdu']
      const stageLabels: Record<string, string> = {
        prospect: 'Prospect',
        qualification: 'Qualif.',
        proposition: 'Proposition',
        negociation: 'Négociation',
        gagne: 'Gagné',
        perdu: 'Perdu',
      }
      const stageData = stageOrder.map((stage) => {
        const stageDeals = deals.filter((d) => d.stage === stage)
        return {
          name: stageLabels[stage],
          deals: stageDeals.length,
          montant: stageDeals.reduce((s, d) => s + d.amount, 0),
        }
      })
      setPipeline(stageData)

      // Sources pie
      const sourceCount: Record<string, number> = {}
      deals.forEach((d) => {
        const src = d.source || 'autre'
        sourceCount[src] = (sourceCount[src] || 0) + 1
      })
      const sourceLabels: Record<string, string> = {
        referral: 'Recommandation',
        website: 'Site web',
        linkedin: 'LinkedIn',
        cold_call: 'Prospection',
        event: 'Événement',
        autre: 'Autre',
      }
      setSources(
        Object.entries(sourceCount).map(([key, value]) => ({
          name: sourceLabels[key] || key,
          value,
        }))
      )

      // CA Evolution (12 derniers mois)
      const wonDeals = deals.filter((d) => d.stage === 'gagne' && d.closed_at)
      const monthlyCA: Record<string, number> = {}
      wonDeals.forEach((d) => {
        const m = d.closed_at!.slice(0, 7) // YYYY-MM
        monthlyCA[m] = (monthlyCA[m] || 0) + d.amount
      })
      const months = []
      const now = new Date()
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        months.push({
          mois: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
          ca: monthlyCA[key] || 0,
        })
      }
      setCaEvolution(months)
      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div
        className="rounded-[14px] p-5 flex items-center justify-center h-64"
        style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3', boxShadow: '0 1px 4px rgba(30,45,61,0.06)' }}
      >
        <div className="text-sm" style={{ color: '#6b7280' }}>Chargement des graphiques...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* CA Evolution */}
      <div
        className="rounded-[14px] p-5"
        style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3', boxShadow: '0 1px 4px rgba(30,45,61,0.06)' }}
      >
        <h2 className="font-semibold text-sm mb-4" style={{ color: '#1e2d3d' }}>
          Évolution CA (12 mois)
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={caEvolution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0ee" />
            <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#6b7280' }} />
            <YAxis
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`}
            />
            <Tooltip formatter={(v: number) => formatCurrency(v)} />
            <Line
              type="monotone"
              dataKey="ca"
              stroke="#e8842c"
              strokeWidth={2}
              dot={{ fill: '#e8842c', r: 3 }}
              name="CA"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pipeline funnel + Sources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className="rounded-[14px] p-5"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3', boxShadow: '0 1px 4px rgba(30,45,61,0.06)' }}
        >
          <h2 className="font-semibold text-sm mb-4" style={{ color: '#1e2d3d' }}>
            Pipeline — deals par étape
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pipeline} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0ee" />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#6b7280' }} width={80} />
              <Tooltip />
              <Bar dataKey="deals" fill="#e8842c" radius={[0, 4, 4, 0]} name="Deals" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div
          className="rounded-[14px] p-5"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3', boxShadow: '0 1px 4px rgba(30,45,61,0.06)' }}
        >
          <h2 className="font-semibold text-sm mb-4" style={{ color: '#1e2d3d' }}>
            Répartition par source
          </h2>
          {sources.length === 0 ? (
            <div
              className="flex items-center justify-center h-48 text-sm"
              style={{ color: '#6b7280' }}
            >
              Aucune donnée
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={sources}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                >
                  {sources.map((_, i) => (
                    <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
