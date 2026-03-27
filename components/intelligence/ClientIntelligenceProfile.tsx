'use client'

import React, { useState } from 'react'
import { Save, Loader2, TrendingUp, ChevronRight, RefreshCw, Check, X } from 'lucide-react'
import type { ClientIntelligence, OpportuniteIA } from '@/lib/types'
import { SERVICES, getEffectifLabel, getServiceLabel } from '@/lib/intelligence/engine'
import OpportuniteModal from './OpportuniteModal'

interface Props {
  intel: ClientIntelligence & {
    prospect?: {
      company_name: string
      sector: string | null
      contacts?: Array<{ id: string; name: string; email: string | null; is_primary: boolean }>
    }
  }
  opportunites: OpportuniteIA[]
  prospectId: string
}

const SERVICES_LIST = Object.entries(SERVICES).map(([key, cfg]) => ({ key, label: cfg.label }))

const STATUT_CONFIG: Record<string, { label: string; color: string }> = {
  nouvelle: { label: 'Nouvelle', color: '#3b82f6' },
  en_cours: { label: 'En cours', color: '#f59e0b' },
  proposee: { label: 'Proposée', color: '#8b5cf6' },
  gagnee: { label: 'Gagnée', color: '#10b981' },
  perdue: { label: 'Perdue', color: '#ef4444' },
  ignoree: { label: 'Ignorée', color: '#6b7280' },
}

export default function ClientIntelligenceProfile({ intel: initialIntel, opportunites: initialOpps, prospectId }: Props) {
  const [intel, setIntel] = useState(initialIntel)
  const [opps, setOpps] = useState(initialOpps)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [selectedOpp, setSelectedOpp] = useState<OpportuniteIA | null>(null)

  const [form, setForm] = useState({
    secteur: intel.secteur ?? '',
    code_naf: intel.code_naf ?? '',
    idcc: intel.idcc ?? '',
    idcc_libelle: intel.idcc_libelle ?? '',
    effectif_tranche: intel.effectif_tranche,
    notes_internes: intel.notes_internes ?? '',
  })

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/intelligence/clients/${prospectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      setIntel(prev => ({ ...prev, ...data }))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleService(key: string, liste: 'services_souscrits' | 'services_potentiels') {
    const current = intel[liste] ?? []
    const updated = current.includes(key) ? current.filter(s => s !== key) : [...current, key]
    const other = liste === 'services_souscrits' ? 'services_potentiels' : 'services_souscrits'
    const otherList = (intel[other] ?? []).filter(s => s !== key)

    const res = await fetch(`/api/intelligence/clients/${prospectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [liste]: updated, [other]: otherList }),
    })
    const data = await res.json()
    setIntel(prev => ({ ...prev, ...data }))
  }

  async function handleDetect() {
    setDetecting(true)
    try {
      await fetch('/api/intelligence/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospect_id: prospectId }),
      })
      const res = await fetch(`/api/intelligence/clients/${prospectId}`)
      const data = await res.json()
      setIntel(prev => ({ ...prev, score_opportunite: data.intel?.score_opportunite ?? prev.score_opportunite }))
      setOpps(data.opportunites ?? [])
    } finally {
      setDetecting(false)
    }
  }

  function handleStatutChange(id: string, statut: string) {
    setOpps(prev => prev.map(o => o.id === id ? { ...o, statut: statut as OpportuniteIA['statut'] } : o))
    if (selectedOpp?.id === id) setSelectedOpp(prev => prev ? { ...prev, statut: statut as OpportuniteIA['statut'] } : null)
  }

  const activeOpps = opps.filter(o => ['nouvelle', 'en_cours', 'proposee'].includes(o.statut))
  const caPotentiel = activeOpps.reduce((sum, o) => sum + o.ca_estime, 0)

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ backgroundColor: '#f8f8f6' }}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl p-5" style={{ backgroundColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 className="font-semibold text-sm mb-4" style={{ color: '#1e2d3d' }}>Profil enrichi</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'secteur', label: 'Secteur d\'activité' },
                { key: 'code_naf', label: 'Code NAF' },
                { key: 'idcc', label: 'N° IDCC' },
                { key: 'idcc_libelle', label: 'Convention collective' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>{field.label}</label>
                  <input
                    value={form[field.key as keyof typeof form]}
                    onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm border"
                    style={{ borderColor: '#e5e5e3', color: '#1e2d3d', outline: 'none' }}
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Effectif</label>
                <div className="flex gap-2">
                  {(['-11', '11-50', '50-250', '250+'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setForm(prev => ({ ...prev, effectif_tranche: t }))}
                      className="flex-1 py-2 rounded-xl text-xs font-medium border transition-all"
                      style={{
                        borderColor: form.effectif_tranche === t ? '#e8842c' : '#e5e5e3',
                        backgroundColor: form.effectif_tranche === t ? '#e8842c15' : 'transparent',
                        color: form.effectif_tranche === t ? '#e8842c' : '#6b7280',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Notes internes</label>
                <textarea
                  value={form.notes_internes}
                  onChange={e => setForm(prev => ({ ...prev, notes_internes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl text-sm border resize-none"
                  style={{ borderColor: '#e5e5e3', color: '#1e2d3d', outline: 'none' }}
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ backgroundColor: '#e8842c' }}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
                {saved ? 'Sauvegardé' : 'Sauvegarder'}
              </button>
            </div>
          </div>

          {/* Carte services */}
          <div className="rounded-2xl p-5" style={{ backgroundColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 className="font-semibold text-sm mb-4" style={{ color: '#1e2d3d' }}>Services</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SERVICES_LIST.map(({ key, label }) => {
                const souscrit = intel.services_souscrits.includes(key)
                const potentiel = intel.services_potentiels.includes(key)
                return (
                  <div
                    key={key}
                    className="p-2 rounded-xl border text-xs"
                    style={{
                      borderColor: souscrit ? '#10b981' : potentiel ? '#e8842c' : '#e5e5e3',
                      backgroundColor: souscrit ? '#10b98110' : potentiel ? '#e8842c10' : 'transparent',
                    }}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-medium truncate" style={{ color: '#1e2d3d' }}>{label}</span>
                      {souscrit && <Check size={10} style={{ color: '#10b981', flexShrink: 0 }} />}
                      {potentiel && !souscrit && <TrendingUp size={10} style={{ color: '#e8842c', flexShrink: 0 }} />}
                    </div>
                    <div className="flex gap-1 mt-1">
                      <button
                        onClick={() => handleToggleService(key, 'services_souscrits')}
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: souscrit ? '#10b98120' : '#f3f4f6', color: souscrit ? '#10b981' : '#9ca3af' }}
                      >
                        {souscrit ? '✓ Souscrit' : 'Souscrit?'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-3 mt-3 text-xs">
              <span className="flex items-center gap-1" style={{ color: '#10b981' }}><Check size={10} /> Souscrit</span>
              <span className="flex items-center gap-1" style={{ color: '#e8842c' }}><TrendingUp size={10} /> Potentiel</span>
              <span className="flex items-center gap-1" style={{ color: '#9ca3af' }}><X size={10} /> Non souscrit</span>
            </div>
          </div>
        </div>

        {/* Right: score + opps */}
        <div className="space-y-4">
          {/* Score */}
          <div className="rounded-2xl p-5" style={{ backgroundColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p className="text-xs mb-2" style={{ color: '#6b7280' }}>Score d&apos;opportunité</p>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                style={{ backgroundColor: intel.score_opportunite > 60 ? '#10b981' : intel.score_opportunite > 30 ? '#f59e0b' : '#6b7280' }}
              >
                {intel.score_opportunite}
              </div>
              <div>
                <p className="font-semibold" style={{ color: '#1e2d3d' }}>
                  {intel.score_opportunite > 60 ? 'Potentiel élevé' : intel.score_opportunite > 30 ? 'Potentiel moyen' : 'Potentiel faible'}
                </p>
                <p className="text-xs" style={{ color: '#6b7280' }}>{getEffectifLabel(intel.effectif_tranche)}</p>
              </div>
            </div>
            <div className="w-full rounded-full h-2" style={{ backgroundColor: '#e5e5e3' }}>
              <div className="h-2 rounded-full transition-all" style={{ width: `${intel.score_opportunite}%`, backgroundColor: '#e8842c' }} />
            </div>
            <div className="mt-3 pt-3 grid grid-cols-2 gap-2" style={{ borderTop: '1px solid #e5e5e3' }}>
              <div>
                <p className="text-xs" style={{ color: '#6b7280' }}>CA potentiel</p>
                <p className="text-sm font-bold" style={{ color: '#1e2d3d' }}>{caPotentiel.toLocaleString('fr-FR')} €</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: '#6b7280' }}>Opportunités</p>
                <p className="text-sm font-bold" style={{ color: '#1e2d3d' }}>{activeOpps.length} actives</p>
              </div>
            </div>
          </div>

          {/* Opportunités */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #e5e5e3' }}>
              <h3 className="font-semibold text-sm" style={{ color: '#1e2d3d' }}>Opportunités</h3>
              <button
                onClick={handleDetect}
                disabled={detecting}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-white"
                style={{ backgroundColor: '#e8842c' }}
              >
                {detecting ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                Détecter
              </button>
            </div>
            <div className="divide-y max-h-64 overflow-y-auto">
              {opps.length === 0 && (
                <p className="text-xs text-center py-6" style={{ color: '#6b7280' }}>Aucune opportunité</p>
              )}
              {opps.map(opp => {
                const statut = STATUT_CONFIG[opp.statut]
                return (
                  <button
                    key={opp.id}
                    onClick={() => setSelectedOpp(opp)}
                    className="w-full flex items-start gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: statut?.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: '#1e2d3d' }}>{opp.titre}</p>
                      <p className="text-xs" style={{ color: '#6b7280' }}>
                        {getServiceLabel(opp.service_propose)} — {opp.ca_estime.toLocaleString('fr-FR')} €
                      </p>
                    </div>
                    <ChevronRight size={12} style={{ color: '#6b7280', flexShrink: 0 }} />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {selectedOpp && (
        <OpportuniteModal
          opportunite={{ ...selectedOpp, prospect: { company_name: intel.prospect?.company_name ?? '' } }}
          onClose={() => setSelectedOpp(null)}
          onStatutChange={handleStatutChange}
        />
      )}
    </div>
  )
}
