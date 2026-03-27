'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Brain,
  TrendingUp,
  Users,
  AlertTriangle,
  Zap,
  ChevronRight,
  Loader2,
  Calendar,
} from 'lucide-react'
import type { ClientIntelligence, OpportuniteIA, ActuImpact } from '@/lib/types'
import {
  serviceLabel,
  opportuniteStatutLabel,
  opportuniteStatutColor,
  sourceTypeLabel,
} from '@/lib/intelligence/engine'
import { formatCurrency } from '@/lib/utils'
import OpportuniteModal from './OpportuniteModal'

interface Props {
  initialClients: ClientIntelligence[]
  initialOpportunites: OpportuniteIA[]
  initialActus: ActuImpact[]
}

const MOIS_SAISONNIER = [
  { mois: 1, label: 'Janvier', service: 'NAO', couleur: '#6366f1' },
  { mois: 3, label: 'Mars', service: 'Entretiens professionnels', couleur: '#8b5cf6' },
  { mois: 9, label: 'Septembre', service: 'Rentrée sociale', couleur: '#f59e0b' },
  { mois: 12, label: 'Décembre', service: 'Bilan social', couleur: '#ef4444' },
]

export default function IntelligenceClient({
  initialClients,
  initialOpportunites,
  initialActus,
}: Props) {
  const router = useRouter()
  const [clients] = useState(initialClients)
  const [opportunites, setOpportunites] = useState(initialOpportunites)
  const [actus] = useState(initialActus)
  const [selectedOpp, setSelectedOpp] = useState<OpportuniteIA | null>(null)
  const [detecting, setDetecting] = useState(false)
  const [activeTab, setActiveTab] = useState<'opportunites' | 'actus' | 'clients'>('opportunites')

  const caPotentiel = opportunites
    .filter((o) => ['detectee', 'en_cours'].includes(o.statut))
    .reduce((sum, o) => sum + (o.ca_estime ?? 0), 0)

  const oppsActives = opportunites.filter((o) => ['detectee', 'en_cours'].includes(o.statut))
  const converties = opportunites.filter((o) => o.statut === 'convertie')
  const traitees = opportunites.filter((o) => ['convertie', 'ignoree', 'envoyee'].includes(o.statut))
  const tauxConversion = traitees.length > 0
    ? Math.round((converties.length / traitees.length) * 100)
    : 0

  const moisActuel = new Date().getMonth() + 1

  async function handleDetectAll() {
    setDetecting(true)
    try {
      await fetch('/api/intelligence/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      router.refresh()
    } finally {
      setDetecting(false)
    }
  }

  function handleStatutChange(id: string, statut: OpportuniteIA['statut']) {
    setOpportunites((prev) =>
      prev.map((o) => (o.id === id ? { ...o, statut } : o))
    )
  }

  return (
    <div className="flex-1 overflow-auto p-6" style={{ backgroundColor: '#f8f8f6' }}>
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium uppercase tracking-wide" style={{ color: '#6b7280' }}>
              Clients profilés
            </span>
            <Users size={16} style={{ color: '#e8842c' }} />
          </div>
          <div className="text-3xl font-bold" style={{ color: '#1e2d3d' }}>
            {clients.length}
          </div>
        </div>

        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium uppercase tracking-wide" style={{ color: '#6b7280' }}>
              Opportunités actives
            </span>
            <Brain size={16} style={{ color: '#e8842c' }} />
          </div>
          <div className="text-3xl font-bold" style={{ color: '#1e2d3d' }}>
            {oppsActives.length}
          </div>
        </div>

        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium uppercase tracking-wide" style={{ color: '#6b7280' }}>
              CA potentiel
            </span>
            <TrendingUp size={16} style={{ color: '#e8842c' }} />
          </div>
          <div className="text-3xl font-bold" style={{ color: '#e8842c' }}>
            {formatCurrency(caPotentiel)}
          </div>
        </div>

        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium uppercase tracking-wide" style={{ color: '#6b7280' }}>
              Taux conversion
            </span>
            <Zap size={16} style={{ color: '#e8842c' }} />
          </div>
          <div className="text-3xl font-bold" style={{ color: '#1e2d3d' }}>
            {tauxConversion}%
          </div>
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-2">
          {(['opportunites', 'actus', 'clients'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{
                backgroundColor: activeTab === tab ? '#e8842c' : '#ffffff',
                color: activeTab === tab ? '#ffffff' : '#6b7280',
                border: '1px solid',
                borderColor: activeTab === tab ? '#e8842c' : '#e5e5e3',
              }}
            >
              {tab === 'opportunites' ? `Opportunités (${oppsActives.length})` : tab === 'actus' ? `Actus juridiques (${actus.length})` : `Top clients`}
            </button>
          ))}
        </div>

        <button
          onClick={handleDetectAll}
          disabled={detecting}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#1e2d3d' }}
        >
          {detecting ? <Loader2 size={15} className="animate-spin" /> : <Brain size={15} />}
          Lancer la détection IA
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Main content */}
        <div className="col-span-2 space-y-4">
          {activeTab === 'opportunites' && (
            <>
              {oppsActives.length === 0 ? (
                <div
                  className="rounded-2xl p-12 text-center"
                  style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
                >
                  <Brain size={40} className="mx-auto mb-4 opacity-30" style={{ color: '#e8842c' }} />
                  <p className="text-sm" style={{ color: '#6b7280' }}>
                    Aucune opportunité active. Cliquez sur &quot;Lancer la détection IA&quot; pour analyser vos clients.
                  </p>
                </div>
              ) : (
                oppsActives.map((opp) => (
                  <button
                    key={opp.id}
                    onClick={() => setSelectedOpp(opp)}
                    className="w-full rounded-2xl p-5 text-left transition-shadow hover:shadow-md"
                    style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: opportuniteStatutColor(opp.statut) + '20',
                              color: opportuniteStatutColor(opp.statut),
                            }}
                          >
                            {opportuniteStatutLabel(opp.statut)}
                          </span>
                          <span className="text-xs" style={{ color: '#6b7280' }}>
                            {serviceLabel(opp.service_propose)}
                          </span>
                        </div>
                        <div className="font-semibold text-sm mb-1" style={{ color: '#1e2d3d' }}>
                          {opp.titre}
                        </div>
                        <div className="text-xs" style={{ color: '#6b7280' }}>
                          {(opp.prospect as { company_name?: string } | undefined)?.company_name}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold" style={{ color: '#e8842c' }}>
                          {formatCurrency(opp.ca_estime)}
                        </div>
                        <ChevronRight size={14} className="ml-auto mt-1" style={{ color: '#9ca3af' }} />
                      </div>
                    </div>
                  </button>
                ))
              )}
            </>
          )}

          {activeTab === 'actus' && (
            <>
              {actus.length === 0 ? (
                <div
                  className="rounded-2xl p-12 text-center"
                  style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
                >
                  <AlertTriangle size={40} className="mx-auto mb-4 opacity-30" style={{ color: '#e8842c' }} />
                  <p className="text-sm" style={{ color: '#6b7280' }}>Aucune actualité juridique.</p>
                </div>
              ) : (
                actus.map((actu) => (
                  <div
                    key={actu.id}
                    className="rounded-2xl p-5"
                    style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: '#fff7ed' }}
                      >
                        <AlertTriangle size={15} style={{ color: '#e8842c' }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}
                          >
                            {sourceTypeLabel(actu.source_type)}
                          </span>
                          <span className="text-xs" style={{ color: '#9ca3af' }}>
                            {actu.clients_concernes_ids.length} client(s) concerné(s)
                          </span>
                        </div>
                        <div className="font-semibold text-sm mb-2" style={{ color: '#1e2d3d' }}>
                          {actu.titre}
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>
                          {actu.resume}
                        </p>
                        {actu.source_ref && (
                          <div className="text-xs mt-2" style={{ color: '#9ca3af' }}>
                            Réf : {actu.source_ref}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'clients' && (
            <>
              {clients.slice(0, 10).map((ci, index) => (
                <button
                  key={ci.id}
                  onClick={() => router.push(`/intelligence/${ci.prospect_id}`)}
                  className="w-full rounded-2xl p-5 text-left transition-shadow hover:shadow-md"
                  style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: index < 3 ? '#fff7ed' : '#f8f8f6', color: index < 3 ? '#e8842c' : '#6b7280' }}
                    >
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm" style={{ color: '#1e2d3d' }}>
                        {ci.prospect?.company_name ?? 'Client'}
                      </div>
                      <div className="text-xs" style={{ color: '#6b7280' }}>
                        {ci.secteur ?? 'Secteur non renseigné'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold" style={{ color: ci.score_opportunite >= 70 ? '#e8842c' : '#1e2d3d' }}>
                        {ci.score_opportunite}
                      </div>
                      <div className="text-xs" style={{ color: '#9ca3af' }}>score</div>
                    </div>
                    <ChevronRight size={14} style={{ color: '#9ca3af' }} />
                  </div>
                  {/* Score bar */}
                  <div className="mt-3 h-1.5 rounded-full" style={{ backgroundColor: '#f3f4f6' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${ci.score_opportunite}%`,
                        backgroundColor: ci.score_opportunite >= 70 ? '#e8842c' : ci.score_opportunite >= 40 ? '#f59e0b' : '#6b7280',
                      }}
                    />
                  </div>
                </button>
              ))}
            </>
          )}
        </div>

        {/* Sidebar right */}
        <div className="space-y-4">
          {/* Timeline saisonnière */}
          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={15} style={{ color: '#e8842c' }} />
              <span className="text-sm font-semibold" style={{ color: '#1e2d3d' }}>
                Saisonnalité
              </span>
            </div>
            <div className="space-y-3">
              {MOIS_SAISONNIER.map((item) => (
                <div key={item.mois} className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: moisActuel === item.mois ? item.couleur : '#e5e5e3' }}
                  />
                  <div className="flex-1">
                    <div
                      className="text-xs font-medium"
                      style={{ color: moisActuel === item.mois ? '#1e2d3d' : '#9ca3af' }}
                    >
                      {item.label}
                    </div>
                    <div className="text-xs" style={{ color: '#9ca3af' }}>
                      {item.service}
                    </div>
                  </div>
                  {moisActuel === item.mois && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: item.couleur + '20', color: item.couleur }}
                    >
                      Maintenant
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Répartition par statut */}
          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
          >
            <div className="text-sm font-semibold mb-4" style={{ color: '#1e2d3d' }}>
              Statuts opportunités
            </div>
            {(['detectee', 'en_cours', 'envoyee', 'convertie', 'ignoree'] as const).map((statut) => {
              const count = opportunites.filter((o) => o.statut === statut).length
              if (count === 0) return null
              return (
                <div key={statut} className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: opportuniteStatutColor(statut) }}
                    />
                    <span className="text-xs" style={{ color: '#6b7280' }}>
                      {opportuniteStatutLabel(statut)}
                    </span>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: '#1e2d3d' }}>
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Modal opportunité */}
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
