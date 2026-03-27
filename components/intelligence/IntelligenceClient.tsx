'use client'

import React, { useState } from 'react'
import { TrendingUp, AlertCircle, Users, Euro, ChevronRight, RefreshCw, Loader2 } from 'lucide-react'
import type { ClientIntelligence, OpportuniteIA, ActuImpact, IntelligenceDashboardStats } from '@/lib/types'
import { getServiceLabel } from '@/lib/intelligence/engine'
import OpportuniteModal from './OpportuniteModal'
import Link from 'next/link'

interface Props {
  stats: IntelligenceDashboardStats
  opportunites: (OpportuniteIA & { prospect?: { company_name: string; sector: string | null } })[]
  actus: ActuImpact[]
  topClients: (ClientIntelligence & { prospect?: { company_name: string; sector: string | null } })[]
}

const STATUT_CONFIG: Record<string, { label: string; color: string }> = {
  nouvelle: { label: 'Nouvelle', color: '#3b82f6' },
  en_cours: { label: 'En cours', color: '#f59e0b' },
  proposee: { label: 'Proposée', color: '#8b5cf6' },
  gagnee: { label: 'Gagnée', color: '#10b981' },
  perdue: { label: 'Perdue', color: '#ef4444' },
  ignoree: { label: 'Ignorée', color: '#6b7280' },
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  service_manquant: { label: 'Service manquant', color: '#e8842c' },
  saisonnalite: { label: 'Saisonnalité', color: '#3b82f6' },
  actu_juridique: { label: 'Actu juridique', color: '#8b5cf6' },
}

export default function IntelligenceClient({ stats: initialStats, opportunites: initialOpps, actus, topClients: initialClients }: Props) {
  const [stats, setStats] = useState(initialStats)
  const [opportunites, setOpportunites] = useState(initialOpps)
  const [topClients] = useState(initialClients)
  const [selectedOpp, setSelectedOpp] = useState<(typeof initialOpps)[0] | null>(null)
  const [detecting, setDetecting] = useState(false)
  const [filterStatut, setFilterStatut] = useState<string>('all')

  async function handleDetectAll() {
    setDetecting(true)
    try {
      await fetch('/api/intelligence/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const res = await fetch('/api/intelligence')
      const data = await res.json()
      setStats(data.stats)
      setOpportunites(data.opportunites_recentes)
    } finally {
      setDetecting(false)
    }
  }

  function handleStatutChange(id: string, statut: string) {
    setOpportunites(prev => prev.map(o => o.id === id ? { ...o, statut: statut as OpportuniteIA['statut'] } : o))
    if (selectedOpp?.id === id) setSelectedOpp(prev => prev ? { ...prev, statut: statut as OpportuniteIA['statut'] } : null)
  }

  const filtered = filterStatut === 'all' ? opportunites : opportunites.filter(o => o.statut === filterStatut)

  const saisonnieres = [
    { mois: 'Janvier–Février', label: 'NAO', color: '#3b82f6' },
    { mois: 'Février–Avril', label: 'Entretiens professionnels', color: '#10b981' },
    { mois: 'Août–Septembre', label: 'Rentrée sociale', color: '#f59e0b' },
    { mois: 'Novembre–Décembre', label: 'Bilan annuel', color: '#8b5cf6' },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ backgroundColor: '#f8f8f6' }}>
      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Opportunités actives', value: stats.total_opportunites, icon: TrendingUp, color: '#e8842c' },
          { label: 'CA potentiel', value: `${(stats.ca_potentiel / 1000).toFixed(0)}k €`, icon: Euro, color: '#10b981' },
          { label: 'Clients avec opportunités', value: stats.clients_avec_opportunites, icon: Users, color: '#3b82f6' },
          { label: 'Nouvelles cette semaine', value: stats.nouvelles_cette_semaine, icon: AlertCircle, color: '#8b5cf6' },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-2xl p-4" style={{ backgroundColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs" style={{ color: '#6b7280' }}>{kpi.label}</p>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: kpi.color + '15' }}>
                <kpi.icon size={16} style={{ color: kpi.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#1e2d3d' }}>{kpi.value}</p>
            {kpi.label === 'CA potentiel' && (
              <p className="text-xs mt-1" style={{ color: '#6b7280' }}>Taux conv. : {stats.taux_conversion}%</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Opportunités */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden" style={{ backgroundColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #e5e5e3' }}>
            <h3 className="font-semibold text-sm" style={{ color: '#1e2d3d' }}>Opportunités détectées</h3>
            <div className="flex items-center gap-2">
              <select
                value={filterStatut}
                onChange={e => setFilterStatut(e.target.value)}
                className="text-xs px-2 py-1 rounded-lg border"
                style={{ borderColor: '#e5e5e3', color: '#6b7280' }}
              >
                <option value="all">Tous statuts</option>
                {Object.entries(STATUT_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <button
                onClick={handleDetectAll}
                disabled={detecting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white"
                style={{ backgroundColor: '#e8842c' }}
              >
                {detecting ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                Détecter
              </button>
            </div>
          </div>
          <div className="divide-y" style={{ divideColor: '#e5e5e3' }}>
            {filtered.length === 0 && (
              <div className="py-12 text-center">
                <TrendingUp size={32} className="mx-auto mb-2" style={{ color: '#e5e5e3' }} />
                <p className="text-sm" style={{ color: '#6b7280' }}>Aucune opportunité pour ce filtre</p>
              </div>
            )}
            {filtered.map(opp => {
              const statut = STATUT_CONFIG[opp.statut] ?? STATUT_CONFIG.nouvelle
              const type = TYPE_CONFIG[opp.type] ?? TYPE_CONFIG.service_manquant
              return (
                <button
                  key={opp.id}
                  onClick={() => setSelectedOpp(opp)}
                  className="w-full flex items-start gap-3 px-5 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: statut.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium truncate" style={{ color: '#1e2d3d' }}>{opp.titre}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: type.color + '15', color: type.color }}>
                        {type.label}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: '#6b7280' }}>
                      {opp.prospect?.company_name} — {getServiceLabel(opp.service_propose)}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-semibold" style={{ color: '#1e2d3d' }}>{opp.ca_estime.toLocaleString('fr-FR')} €</p>
                    <ChevronRight size={14} style={{ color: '#6b7280' }} />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Top clients */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #e5e5e3' }}>
              <h3 className="font-semibold text-sm" style={{ color: '#1e2d3d' }}>Top clients</h3>
            </div>
            <div className="divide-y" style={{ divideColor: '#e5e5e3' }}>
              {topClients.slice(0, 5).map((client, i) => (
                <Link
                  key={client.id}
                  href={`/intelligence/${client.prospect_id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-xs font-bold w-4" style={{ color: i < 3 ? '#e8842c' : '#6b7280' }}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: '#1e2d3d' }}>{client.prospect?.company_name}</p>
                    <p className="text-xs truncate" style={{ color: '#6b7280' }}>{client.prospect?.sector}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white" style={{ backgroundColor: '#e8842c' }}>
                    {client.score_opportunite}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Actus juridiques */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #e5e5e3' }}>
              <h3 className="font-semibold text-sm" style={{ color: '#1e2d3d' }}>Alertes juridiques</h3>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#ef444415', color: '#ef4444' }}>
                {actus.length} récentes
              </span>
            </div>
            <div className="divide-y" style={{ divideColor: '#e5e5e3' }}>
              {actus.slice(0, 4).map(actu => (
                <div key={actu.id} className="px-5 py-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={12} className="mt-0.5 flex-shrink-0" style={{ color: '#ef4444' }} />
                    <div>
                      <p className="text-xs font-medium" style={{ color: '#1e2d3d' }}>{actu.titre}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
                        {actu.clients_concernes_ids.length} client(s) concerné(s)
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline saisonnière */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #e5e5e3' }}>
              <h3 className="font-semibold text-sm" style={{ color: '#1e2d3d' }}>Calendrier saisonnier</h3>
            </div>
            <div className="p-4 space-y-2">
              {saisonnieres.map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                  <div className="flex-1">
                    <p className="text-xs font-medium" style={{ color: '#1e2d3d' }}>{s.label}</p>
                    <p className="text-xs" style={{ color: '#6b7280' }}>{s.mois}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedOpp && (
        <OpportuniteModal
          opportunite={selectedOpp}
          onClose={() => setSelectedOpp(null)}
          onStatutChange={handleStatutChange}
        />
      )}
    </div>
  )
}
