'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Brain, CheckCircle, X, Loader2 } from 'lucide-react'
import type { ClientIntelligence, OpportuniteIA, EffectifTranche, ServiceIntelligence } from '@/lib/types'
import {
  serviceLabel,
  effectifLabel,
  opportuniteStatutLabel,
  opportuniteStatutColor,
} from '@/lib/intelligence/engine'
import { formatCurrency } from '@/lib/utils'
import OpportuniteModal from './OpportuniteModal'

const TOUS_LES_SERVICES: ServiceIntelligence[] = [
  'contentieux',
  'conseil_contrats',
  'audit_rh',
  'formation_managers',
  'audit_rgpd',
  'nao',
  'bilan_social',
  'entretiens_pro',
  'rentree_sociale',
  'info_collective',
  'securisation_contrats',
]

const EFFECTIF_OPTIONS: { value: EffectifTranche; label: string }[] = [
  { value: 'moins_11', label: 'Moins de 11 salariés' },
  { value: '11_50', label: '11 à 50 salariés' },
  { value: '50_250', label: '50 à 250 salariés' },
  { value: '250_plus', label: 'Plus de 250 salariés' },
]

interface Props {
  ci: ClientIntelligence
  initialOpportunites: OpportuniteIA[]
  initialPropositions: unknown[]
}

export default function ClientIntelligenceProfile({
  ci: initialCi,
  initialOpportunites,
}: Props) {
  const router = useRouter()
  const [ci, setCi] = useState(initialCi)
  const [opportunites, setOpportunites] = useState(initialOpportunites)
  const [selectedOpp, setSelectedOpp] = useState<OpportuniteIA | null>(null)
  const [saving, setSaving] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState({
    secteur: ci.secteur ?? '',
    code_naf: ci.code_naf ?? '',
    idcc: ci.idcc ?? '',
    effectif_tranche: ci.effectif_tranche ?? '',
    services_souscrits: ci.services_souscrits ?? [],
  })

  function toggleService(service: ServiceIntelligence) {
    setForm((prev) => ({
      ...prev,
      services_souscrits: prev.services_souscrits.includes(service)
        ? prev.services_souscrits.filter((s) => s !== service)
        : [...prev.services_souscrits, service],
    }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/intelligence/clients/${ci.prospect_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!data.error) {
        setCi({ ...ci, ...form })
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDetect() {
    setDetecting(true)
    try {
      await fetch('/api/intelligence/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospect_id: ci.prospect_id }),
      })
      // Recharger les opportunités
      const res = await fetch(`/api/intelligence/opportunites?prospect_id=${ci.prospect_id}`)
      const data = await res.json()
      setOpportunites(data)
    } finally {
      setDetecting(false)
    }
  }

  function handleStatutChange(id: string, statut: OpportuniteIA['statut']) {
    setOpportunites((prev) =>
      prev.map((o) => (o.id === id ? { ...o, statut } : o))
    )
  }

  const servicesSouscrits = form.services_souscrits
  const servicesPotentiels = TOUS_LES_SERVICES.filter(
    (s) => !servicesSouscrits.includes(s)
  )
  const caPotentiel = opportunites
    .filter((o) => ['detectee', 'en_cours'].includes(o.statut))
    .reduce((sum, o) => sum + (o.ca_estime ?? 0), 0)

  return (
    <div className="flex-1 overflow-auto p-6" style={{ backgroundColor: '#f8f8f6' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl transition-colors hover:bg-white"
          style={{ border: '1px solid #e5e5e3' }}
        >
          <ArrowLeft size={16} style={{ color: '#6b7280' }} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ color: '#1e2d3d' }}>
            {ci.prospect?.company_name ?? 'Client'}
          </h1>
          <div className="text-sm" style={{ color: '#6b7280' }}>
            Score d&apos;opportunité : <span className="font-semibold" style={{ color: '#e8842c' }}>{ci.score_opportunite}/100</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDetect}
            disabled={detecting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ backgroundColor: '#1e2d3d', color: '#ffffff' }}
          >
            {detecting ? <Loader2 size={15} className="animate-spin" /> : <Brain size={15} />}
            Détecter opportunités
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ backgroundColor: '#e8842c', color: '#ffffff' }}
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <CheckCircle size={15} /> : <Save size={15} />}
            {saved ? 'Sauvegardé !' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Formulaire profil enrichi */}
        <div className="col-span-1 space-y-4">
          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#1e2d3d' }}>
              Profil enrichi
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>
                  Secteur d&apos;activité
                </label>
                <input
                  type="text"
                  value={form.secteur}
                  onChange={(e) => setForm({ ...form, secteur: e.target.value })}
                  className="w-full rounded-xl px-3 py-2 text-sm"
                  style={{ border: '1px solid #e5e5e3', outline: 'none', color: '#1e2d3d' }}
                  placeholder="ex : Transport & Logistique"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>
                  Code NAF
                </label>
                <input
                  type="text"
                  value={form.code_naf}
                  onChange={(e) => setForm({ ...form, code_naf: e.target.value })}
                  className="w-full rounded-xl px-3 py-2 text-sm"
                  style={{ border: '1px solid #e5e5e3', outline: 'none', color: '#1e2d3d' }}
                  placeholder="ex : 4941A"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>
                  Convention collective (IDCC)
                </label>
                <input
                  type="text"
                  value={form.idcc}
                  onChange={(e) => setForm({ ...form, idcc: e.target.value })}
                  className="w-full rounded-xl px-3 py-2 text-sm"
                  style={{ border: '1px solid #e5e5e3', outline: 'none', color: '#1e2d3d' }}
                  placeholder="ex : 16 (Transport)"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>
                  Effectif
                </label>
                <select
                  value={form.effectif_tranche}
                  onChange={(e) => setForm({ ...form, effectif_tranche: e.target.value as EffectifTranche })}
                  className="w-full rounded-xl px-3 py-2 text-sm"
                  style={{ border: '1px solid #e5e5e3', outline: 'none', color: '#1e2d3d', backgroundColor: '#ffffff' }}
                >
                  <option value="">-- Sélectionner --</option>
                  {EFFECTIF_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Score bar */}
          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
          >
            <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#6b7280' }}>
              Score d&apos;opportunité
            </div>
            <div className="text-4xl font-bold mb-3" style={{ color: ci.score_opportunite >= 70 ? '#e8842c' : '#1e2d3d' }}>
              {ci.score_opportunite}<span className="text-lg font-normal" style={{ color: '#9ca3af' }}>/100</span>
            </div>
            <div className="h-2 rounded-full" style={{ backgroundColor: '#f3f4f6' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${ci.score_opportunite}%`,
                  backgroundColor: ci.score_opportunite >= 70 ? '#e8842c' : ci.score_opportunite >= 40 ? '#f59e0b' : '#6b7280',
                }}
              />
            </div>
            <div className="mt-3 text-sm font-semibold" style={{ color: '#e8842c' }}>
              CA potentiel : {formatCurrency(caPotentiel)}
            </div>
          </div>
        </div>

        {/* Services + Opportunités */}
        <div className="col-span-2 space-y-4">
          {/* Services souscrits vs potentiels */}
          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#1e2d3d' }}>
              Carte des services
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide mb-3" style={{ color: '#16a34a' }}>
                  Services souscrits ({servicesSouscrits.length})
                </div>
                <div className="space-y-2">
                  {servicesSouscrits.length === 0 ? (
                    <div className="text-xs" style={{ color: '#9ca3af' }}>Aucun service souscrit</div>
                  ) : (
                    servicesSouscrits.map((s) => (
                      <div
                        key={s}
                        className="flex items-center justify-between rounded-lg px-3 py-2"
                        style={{ backgroundColor: '#dcfce7', border: '1px solid #bbf7d0' }}
                      >
                        <span className="text-xs font-medium" style={{ color: '#16a34a' }}>
                          {serviceLabel(s)}
                        </span>
                        <button onClick={() => toggleService(s)}>
                          <X size={12} style={{ color: '#16a34a' }} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wide mb-3" style={{ color: '#e8842c' }}>
                  Services potentiels ({servicesPotentiels.length})
                </div>
                <div className="space-y-2">
                  {servicesPotentiels.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleService(s)}
                      className="w-full flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:opacity-80"
                      style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}
                    >
                      <span className="text-xs font-medium" style={{ color: '#e8842c' }}>
                        {serviceLabel(s)}
                      </span>
                      <span className="text-xs" style={{ color: '#f5a65c' }}>+ Ajouter</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Opportunités */}
          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#1e2d3d' }}>
              Opportunités détectées ({opportunites.length})
            </h3>
            {opportunites.length === 0 ? (
              <div className="text-center py-6" style={{ color: '#9ca3af' }}>
                <Brain size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune opportunité. Lancez la détection IA.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {opportunites.map((opp) => (
                  <button
                    key={opp.id}
                    onClick={() => setSelectedOpp(opp)}
                    className="w-full rounded-xl p-3 text-left transition-colors hover:bg-gray-50"
                    style={{ border: '1px solid #e5e5e3' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: opportuniteStatutColor(opp.statut) }}
                      />
                      <div className="flex-1">
                        <div className="text-xs font-medium" style={{ color: '#1e2d3d' }}>
                          {opp.titre}
                        </div>
                        <div className="text-xs" style={{ color: '#9ca3af' }}>
                          {serviceLabel(opp.service_propose)} • {opportuniteStatutLabel(opp.statut)}
                        </div>
                      </div>
                      <div className="text-xs font-semibold flex-shrink-0" style={{ color: '#e8842c' }}>
                        {formatCurrency(opp.ca_estime)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Infos client */}
          {ci.prospect && (
            <div
              className="rounded-2xl p-5"
              style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
            >
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#1e2d3d' }}>
                Informations client
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs" style={{ color: '#6b7280' }}>Raison sociale</div>
                  <div style={{ color: '#1e2d3d' }}>{ci.prospect.company_name}</div>
                </div>
                {ci.prospect.siren && (
                  <div>
                    <div className="text-xs" style={{ color: '#6b7280' }}>SIREN</div>
                    <div style={{ color: '#1e2d3d' }}>{ci.prospect.siren}</div>
                  </div>
                )}
                {ci.code_naf && (
                  <div>
                    <div className="text-xs" style={{ color: '#6b7280' }}>Code NAF</div>
                    <div style={{ color: '#1e2d3d' }}>{ci.code_naf}</div>
                  </div>
                )}
                {ci.idcc && (
                  <div>
                    <div className="text-xs" style={{ color: '#6b7280' }}>CCN (IDCC)</div>
                    <div style={{ color: '#1e2d3d' }}>{ci.idcc}</div>
                  </div>
                )}
                {ci.effectif_tranche && (
                  <div>
                    <div className="text-xs" style={{ color: '#6b7280' }}>Effectif</div>
                    <div style={{ color: '#1e2d3d' }}>{effectifLabel(ci.effectif_tranche)}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal opportunité */}
      {selectedOpp && (
        <OpportuniteModal
          opportunite={selectedOpp}
          ci={ci}
          onClose={() => setSelectedOpp(null)}
          onStatutChange={handleStatutChange}
        />
      )}
    </div>
  )
}
