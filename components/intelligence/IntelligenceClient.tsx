'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Euro,
  Percent,
  Users,
  Sparkles,
  Calendar,
  ChevronRight,
  Eye,
  Filter,
} from 'lucide-react'
import type { IntelligenceDashboardStats, OpportuniteIA } from '@/lib/types'
import { getTypeLabel, getStatutLabel, getServiceLabel } from '@/lib/intelligence/engine'
import OpportuniteModal from './OpportuniteModal'

interface IntelligenceClientProps {
  stats: IntelligenceDashboardStats
}

const STATUT_COLORS: Record<string, string> = {
  nouvelle: '#e8842c',
  en_cours: '#3b82f6',
  gagnee: '#10b981',
  perdue: '#ef4444',
  ignoree: '#6b7280',
}

const TYPE_COLORS: Record<string, string> = {
  services_manquants: '#e8842c',
  saisonnalite: '#3b82f6',
  actu_juridique: '#8b5cf6',
}

// Prochaines opportunités saisonnières
const SEASONAL_CALENDAR = [
  { month: 'Janvier', service: 'Accompagnement NAO', color: '#3b82f6', icon: '📋' },
  { month: 'Mars', service: 'Entretiens professionnels', color: '#8b5cf6', icon: '🤝' },
  { month: 'Septembre', service: 'Bilan social de rentrée', color: '#10b981', icon: '📊' },
  { month: 'Décembre', service: 'Prévisionnel juridique', color: '#f59e0b', icon: '🗓️' },
]

export default function IntelligenceClient({ stats }: IntelligenceClientProps) {
  const [selectedOpp, setSelectedOpp] = useState<OpportuniteIA | null>(null)
  const [filterStatut, setFilterStatut] = useState<string>('all')
  const [opps, setOpps] = useState<OpportuniteIA[]>(stats.opportunites_recentes)
  const [detecting, setDetecting] = useState(false)

  const filteredOpps = filterStatut === 'all'
    ? opps
    : opps.filter((o) => o.statut === filterStatut)

  async function handleDetect() {
    setDetecting(true)
    try {
      const res = await fetch('/api/intelligence/detect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const data = await res.json()
      if (data.created > 0) {
        // Recharger les opportunités
        const oppRes = await fetch('/api/intelligence/opportunites?limit=50')
        const newOpps = await oppRes.json()
        setOpps(Array.isArray(newOpps) ? newOpps : [])
      }
      alert(`${data.created} nouvelle(s) opportunité(s) détectée(s)`)
    } catch {
      alert('Erreur lors de la détection')
    } finally {
      setDetecting(false)
    }
  }

  const handleGenerate = useCallback(async (id: string) => {
    const res = await fetch('/api/intelligence/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opportunite_id: id }),
    })
    if (res.ok) {
      const updated = await fetch(`/api/intelligence/opportunites/${id}`)
      if (updated.ok) {
        const data = await updated.json()
        setOpps((prev) => prev.map((o) => (o.id === id ? data : o)))
        setSelectedOpp(data)
      }
    }
  }, [])

  const handleStatutChange = useCallback(async (id: string, statut: string) => {
    await fetch(`/api/intelligence/opportunites/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut }),
    })
    setOpps((prev) => prev.map((o) => (o.id === id ? { ...o, statut: statut as OpportuniteIA['statut'] } : o)))
    if (selectedOpp?.id === id) {
      setSelectedOpp((prev) => prev ? { ...prev, statut: statut as OpportuniteIA['statut'] } : prev)
    }
  }, [selectedOpp])

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-2xl p-4" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}>
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} style={{ color: '#e8842c' }} />
            <span className="text-xs" style={{ color: '#6b7280' }}>Clients profilés</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: '#1e2d3d' }}>{stats.total_clients}</p>
        </div>
        <div className="rounded-2xl p-4" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}>
          <div className="flex items-center gap-2 mb-2">
            <Brain size={16} style={{ color: '#8b5cf6' }} />
            <span className="text-xs" style={{ color: '#6b7280' }}>Opportunités totales</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: '#1e2d3d' }}>{stats.total_opportunites}</p>
        </div>
        <div className="rounded-2xl p-4" style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} style={{ color: '#e8842c' }} />
            <span className="text-xs" style={{ color: '#6b7280' }}>Nouvelles</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: '#e8842c' }}>{stats.opportunites_nouvelles}</p>
        </div>
        <div className="rounded-2xl p-4" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}>
          <div className="flex items-center gap-2 mb-2">
            <Euro size={16} style={{ color: '#10b981' }} />
            <span className="text-xs" style={{ color: '#6b7280' }}>CA potentiel</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: '#1e2d3d' }}>{stats.ca_potentiel.toLocaleString('fr-FR')} €</p>
        </div>
        <div className="rounded-2xl p-4" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}>
          <div className="flex items-center gap-2 mb-2">
            <Percent size={16} style={{ color: '#3b82f6' }} />
            <span className="text-xs" style={{ color: '#6b7280' }}>Taux conversion</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: '#1e2d3d' }}>{stats.taux_conversion}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Clients */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm" style={{ color: '#1e2d3d' }}>Top clients — score IA</h2>
            <TrendingUp size={16} style={{ color: '#6b7280' }} />
          </div>
          <div className="space-y-3">
            {stats.top_clients.slice(0, 8).map((client, i) => (
              <Link key={client.id} href={`/intelligence/${client.id}`} className="flex items-center gap-3 group">
                <span className="w-5 text-xs font-bold text-center" style={{ color: i < 3 ? '#e8842c' : '#6b7280' }}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate group-hover:text-orange-500" style={{ color: '#1e2d3d' }}>{client.organisation_nom}</p>
                  <div className="mt-1 h-1.5 rounded-full" style={{ backgroundColor: '#e5e5e3' }}>
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${client.score_opportunite}%`, backgroundColor: i < 3 ? '#e8842c' : '#6b7280' }}
                    />
                  </div>
                </div>
                <span className="text-xs font-bold" style={{ color: '#1e2d3d' }}>{client.score_opportunite}</span>
              </Link>
            ))}
          </div>
          <Link href="/intelligence/clients" className="mt-4 flex items-center gap-1 text-xs font-medium" style={{ color: '#e8842c' }}>
            Voir tous les clients <ChevronRight size={12} />
          </Link>
        </div>

        {/* Alertes Actus */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm" style={{ color: '#1e2d3d' }}>Alertes juridiques</h2>
            <AlertTriangle size={16} style={{ color: '#8b5cf6' }} />
          </div>
          <div className="space-y-3">
            {stats.alertes_actus.length === 0 && (
              <p className="text-xs" style={{ color: '#6b7280' }}>Aucune actualité récente</p>
            )}
            {stats.alertes_actus.map((actu) => (
              <div key={actu.id} className="p-3 rounded-xl" style={{ backgroundColor: '#f8f8f6' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#ede9fe', color: '#8b5cf6' }}>
                    {actu.source_type}
                  </span>
                  <span className="text-xs" style={{ color: '#6b7280' }}>
                    {actu.clients_concernes_ids.length} client(s)
                  </span>
                </div>
                <p className="text-xs font-medium leading-relaxed" style={{ color: '#1e2d3d' }}>{actu.titre}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline saisonnière */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm" style={{ color: '#1e2d3d' }}>Calendrier saisonnier</h2>
            <Calendar size={16} style={{ color: '#6b7280' }} />
          </div>
          <div className="space-y-3">
            {SEASONAL_CALENDAR.map((item) => (
              <div key={item.month} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: '#f8f8f6' }}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: '#1e2d3d' }}>{item.month}</p>
                  <p className="text-xs" style={{ color: '#6b7280' }}>{item.service}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Liste des opportunités */}
      <div className="rounded-2xl" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #e5e5e3' }}>
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-sm" style={{ color: '#1e2d3d' }}>Opportunités IA</h2>
            <div className="flex items-center gap-1">
              <Filter size={12} style={{ color: '#6b7280' }} />
              <select
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
                className="text-xs border-0 bg-transparent outline-none cursor-pointer"
                style={{ color: '#6b7280' }}
              >
                <option value="all">Tous statuts</option>
                <option value="nouvelle">Nouvelles</option>
                <option value="en_cours">En cours</option>
                <option value="gagnee">Gagnées</option>
                <option value="perdue">Perdues</option>
                <option value="ignoree">Ignorées</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleDetect}
            disabled={detecting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: '#e8842c' }}
          >
            <Sparkles size={14} />
            {detecting ? 'Analyse…' : 'Détecter'}
          </button>
        </div>

        <div className="divide-y" style={{ borderColor: '#e5e5e3' }}>
          {filteredOpps.length === 0 && (
            <div className="py-12 text-center">
              <Brain size={32} className="mx-auto mb-3" style={{ color: '#e5e5e3' }} />
              <p className="text-sm" style={{ color: '#6b7280' }}>Aucune opportunité. Cliquez sur "Détecter" pour lancer l'analyse IA.</p>
            </div>
          )}
          {filteredOpps.map((opp) => (
            <div key={opp.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ backgroundColor: TYPE_COLORS[opp.type] ?? '#6b7280' }}>
                    {getTypeLabel(opp.type)}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ backgroundColor: STATUT_COLORS[opp.statut] ?? '#6b7280' }}>
                    {getStatutLabel(opp.statut)}
                  </span>
                </div>
                <p className="text-sm font-medium truncate" style={{ color: '#1e2d3d' }}>{opp.titre}</p>
                <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
                  {opp.organisation_nom}
                  {opp.service_propose && ` · ${getServiceLabel(opp.service_propose)}`}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold" style={{ color: '#e8842c' }}>{opp.ca_estime.toLocaleString('fr-FR')} €</p>
                <p className="text-xs" style={{ color: '#6b7280' }}>HT</p>
              </div>
              <button
                onClick={() => setSelectedOpp(opp)}
                className="p-2 rounded-lg hover:bg-gray-100 flex-shrink-0"
              >
                <Eye size={16} style={{ color: '#6b7280' }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedOpp && (
        <OpportuniteModal
          opportunite={selectedOpp}
          onClose={() => setSelectedOpp(null)}
          onStatutChange={handleStatutChange}
          onGenerate={handleGenerate}
        />
      )}
    </div>
  )
}
