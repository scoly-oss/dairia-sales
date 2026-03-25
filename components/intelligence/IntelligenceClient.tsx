'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Brain,
  TrendingUp,
  AlertCircle,
  Calendar,
  ChevronRight,
  RefreshCw,
  Eye,
  CheckCircle,
  Clock,
} from 'lucide-react'
import {
  EFFECTIF_LABELS,
  OPPORTUNITE_TYPE_LABELS,
  OPPORTUNITE_STATUT_LABELS,
  ACTU_SOURCE_LABELS,
  SERVICE_LABELS,
  opportuniteStatutColor,
  opportuniteStatutBg,
  opportuniteTypeIcon,
} from '@/lib/intelligence/engine'
import { formatDate, formatCurrency } from '@/lib/utils'
import type {
  IntelligenceDashboardStats,
  OpportuniteIA,
  ClientIntelligence,
  ActuImpact,
} from '@/lib/types'

interface IntelligenceClientProps {
  stats: IntelligenceDashboardStats
  opportunites: (OpportuniteIA & { prospect?: { company_name: string } })[]
  clients: (ClientIntelligence & { prospect?: { company_name: string; score: string } })[]
  actus: ActuImpact[]
}

export default function IntelligenceClient({
  stats,
  opportunites,
  clients,
  actus,
}: IntelligenceClientProps) {
  const [detecting, setDetecting] = useState(false)
  const [detectResult, setDetectResult] = useState<{ created: number; updated: number } | null>(
    null
  )

  async function handleDetect() {
    setDetecting(true)
    setDetectResult(null)
    try {
      const res = await fetch('/api/intelligence/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      setDetectResult(data)
      setTimeout(() => window.location.reload(), 1500)
    } finally {
      setDetecting(false)
    }
  }

  const top10 = clients.slice(0, 10)
  const alertesActu = actus.slice(0, 5)

  // Timeline saisonnière (mois suivants)
  const currentMonth = new Date().getMonth() + 1
  const seasonalMonths: Array<{ month: string; label: string; color: string }> = [
    { month: 'Jan', label: 'NAO — Négociations Annuelles', color: '#3b82f6' },
    { month: 'Mar', label: 'Entretiens professionnels', color: '#8b5cf6' },
    { month: 'Sep', label: 'Audit social de rentrée', color: '#f59e0b' },
    { month: 'Déc', label: 'Bilan social annuel', color: '#10b981' },
  ]

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: 'Opportunités totales',
            value: stats.total_opportunites,
            color: '#e8842c',
            bg: '#fff7ed',
          },
          {
            label: 'Non exploitées',
            value: stats.opportunites_non_exploitees,
            color: '#ef4444',
            bg: '#fef2f2',
          },
          {
            label: 'CA potentiel',
            value: formatCurrency(stats.ca_potentiel),
            color: '#10b981',
            bg: '#ecfdf5',
          },
          {
            label: 'Nouvelles (7j)',
            value: stats.nouvelles_cette_semaine,
            color: '#3b82f6',
            bg: '#eff6ff',
          },
          {
            label: 'Taux conversion',
            value: `${stats.taux_conversion}%`,
            color: '#8b5cf6',
            bg: '#f5f3ff',
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-4"
            style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
          >
            <p className="text-xs font-medium mb-1" style={{ color: '#6b7280' }}>
              {s.label}
            </p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Top 10 clients */}
        <div
          className="xl:col-span-2 rounded-xl p-5"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm" style={{ color: '#1e2d3d' }}>
              Top clients par opportunités non exploitées
            </h2>
            <button
              onClick={handleDetect}
              disabled={detecting}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium text-white"
              style={{ backgroundColor: '#e8842c', opacity: detecting ? 0.7 : 1 }}
            >
              <RefreshCw size={12} className={detecting ? 'animate-spin' : ''} />
              {detecting ? 'Analyse...' : 'Relancer détection'}
            </button>
          </div>

          {detectResult && (
            <div
              className="mb-3 p-3 rounded-lg text-sm"
              style={{ backgroundColor: '#ecfdf5', color: '#10b981', border: '1px solid #bbf7d0' }}
            >
              <CheckCircle size={14} className="inline mr-1.5" />
              {detectResult.created} nouvelle(s) opportunité(s) détectée(s), {detectResult.updated}{' '}
              profil(s) mis à jour.
            </div>
          )}

          <div className="space-y-2">
            {top10.map((client, i) => {
              const clientOpps = opportunites.filter(
                (o) =>
                  o.prospect_id === client.prospect_id &&
                  ['nouvelle', 'vue'].includes(o.statut)
              )
              const caTotal = clientOpps.reduce((s, o) => s + (o.ca_estime || 0), 0)
              return (
                <Link
                  key={client.id}
                  href={`/intelligence/${client.prospect_id}`}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all group"
                  style={{ border: '1px solid #f0f0ee' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fafaf8'
                    e.currentTarget.style.borderColor = '#e8842c'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.borderColor = '#f0f0ee'
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: i < 3 ? '#e8842c' : '#6b7280' }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#1e2d3d' }}>
                      {client.prospect?.company_name || '—'}
                    </p>
                    <p className="text-xs" style={{ color: '#6b7280' }}>
                      {EFFECTIF_LABELS[client.effectif_tranche]} ·{' '}
                      {client.secteur || 'secteur non renseigné'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold" style={{ color: '#e8842c' }}>
                      {clientOpps.length} opp.
                    </p>
                    <p className="text-xs" style={{ color: '#6b7280' }}>
                      {formatCurrency(caTotal)}
                    </p>
                  </div>
                  <div className="relative w-16 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#f0f0ee' }}>
                    <div
                      className="absolute left-0 top-0 h-full rounded-full"
                      style={{
                        width: `${client.score_opportunite}%`,
                        backgroundColor: client.score_opportunite > 70 ? '#e8842c' : client.score_opportunite > 40 ? '#f59e0b' : '#10b981',
                      }}
                    />
                  </div>
                  <ChevronRight size={14} style={{ color: '#6b7280' }} className="flex-shrink-0" />
                </Link>
              )
            })}
            {top10.length === 0 && (
              <p className="text-sm text-center py-8" style={{ color: '#6b7280' }}>
                Aucun profil client configuré.{' '}
                <Link href="/prospects" className="underline" style={{ color: '#e8842c' }}>
                  Créer des prospects
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* Panel droit */}
        <div className="space-y-4">
          {/* Alertes actualités */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
          >
            <h2 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: '#1e2d3d' }}>
              <AlertCircle size={15} style={{ color: '#e8842c' }} />
              Alertes juridiques récentes
            </h2>
            <div className="space-y-2">
              {alertesActu.map((actu) => (
                <div
                  key={actu.id}
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0"
                      style={{ backgroundColor: '#e8842c', color: '#fff' }}
                    >
                      {ACTU_SOURCE_LABELS[actu.source_type]}
                    </span>
                    <p className="text-xs font-medium leading-tight" style={{ color: '#1e2d3d' }}>
                      {actu.titre}
                    </p>
                  </div>
                  <p className="text-xs mt-1.5" style={{ color: '#6b7280' }}>
                    {actu.clients_concernes_ids.length} client(s) concerné(s) ·{' '}
                    {formatDate(actu.created_at)}
                  </p>
                </div>
              ))}
              {alertesActu.length === 0 && (
                <p className="text-xs text-center py-4" style={{ color: '#6b7280' }}>
                  Aucune actualité récente.
                </p>
              )}
            </div>
          </div>

          {/* Timeline saisonnière */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
          >
            <h2 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: '#1e2d3d' }}>
              <Calendar size={15} style={{ color: '#3b82f6' }} />
              Opportunités saisonnières
            </h2>
            <div className="space-y-2">
              {seasonalMonths.map((s) => (
                <div key={s.month} className="flex items-center gap-3">
                  <span
                    className="text-xs font-bold w-8 text-center flex-shrink-0"
                    style={{ color: s.color }}
                  >
                    {s.month}
                  </span>
                  <span className="text-xs" style={{ color: '#6b7280' }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dernières opportunités */}
      <div
        className="rounded-xl"
        style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f0f0ee' }}>
          <h2 className="font-semibold text-sm flex items-center gap-2" style={{ color: '#1e2d3d' }}>
            <Brain size={15} style={{ color: '#8b5cf6' }} />
            Dernières opportunités détectées
          </h2>
          <span className="text-xs" style={{ color: '#6b7280' }}>
            {opportunites.filter((o) => o.statut === 'nouvelle').length} nouvelle(s)
          </span>
        </div>
        <div className="divide-y" style={{ borderColor: '#f0f0ee' }}>
          {opportunites.slice(0, 15).map((opp) => (
            <div key={opp.id} className="flex items-start gap-3 px-5 py-3">
              <span className="text-lg flex-shrink-0 mt-0.5">{opportuniteTypeIcon(opp.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium" style={{ color: '#1e2d3d' }}>
                    {opp.titre}
                  </p>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: opportuniteStatutBg(opp.statut),
                      color: opportuniteStatutColor(opp.statut),
                    }}
                  >
                    {OPPORTUNITE_STATUT_LABELS[opp.statut]}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs" style={{ color: '#6b7280' }}>
                    {opp.prospect?.company_name || '—'}
                  </span>
                  <span className="text-xs" style={{ color: '#6b7280' }}>
                    {OPPORTUNITE_TYPE_LABELS[opp.type]}
                  </span>
                  <span className="text-xs font-medium" style={{ color: '#e8842c' }}>
                    {formatCurrency(opp.ca_estime)}
                  </span>
                  <span className="text-xs" style={{ color: '#9ca3af' }}>
                    {SERVICE_LABELS[opp.service_propose]}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs" style={{ color: '#9ca3af' }}>
                  {formatDate(opp.created_at)}
                </span>
                <Link
                  href={`/intelligence/${opp.prospect_id}`}
                  className="p-1.5 rounded-lg"
                  style={{ border: '1px solid #e5e5e3', color: '#6b7280' }}
                >
                  <Eye size={12} />
                </Link>
              </div>
            </div>
          ))}
          {opportunites.length === 0 && (
            <div className="px-5 py-12 text-center">
              <TrendingUp size={32} className="mx-auto mb-3" style={{ color: '#e5e5e3' }} />
              <p className="text-sm" style={{ color: '#6b7280' }}>
                Aucune opportunité détectée.
              </p>
              <button
                onClick={handleDetect}
                className="mt-3 text-sm font-medium underline"
                style={{ color: '#e8842c' }}
              >
                Lancer la première analyse
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-6 text-xs" style={{ color: '#9ca3af' }}>
        <Clock size={12} />
        <span>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</span>
        {[
          { label: 'Service manquant', icon: '🔍' },
          { label: 'Actu juridique', icon: '⚖️' },
          { label: 'Saisonnalité', icon: '📅' },
        ].map((t) => (
          <span key={t.label}>
            {t.icon} {t.label}
          </span>
        ))}
      </div>
    </div>
  )
}
