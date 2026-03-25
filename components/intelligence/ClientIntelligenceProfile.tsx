'use client'

import React, { useState } from 'react'
import {
  Brain,
  Building2,
  FileText,
  ChevronLeft,
  RefreshCw,
  Eye,
  Mail,
  Edit3,
  Save,
  X,
} from 'lucide-react'
import Link from 'next/link'
import {
  EFFECTIF_LABELS,
  OPPORTUNITE_TYPE_LABELS,
  OPPORTUNITE_STATUT_LABELS,
  SERVICE_LABELS,
  ALL_SERVICES,
  opportuniteStatutColor,
  opportuniteStatutBg,
  opportuniteTypeIcon,
} from '@/lib/intelligence/engine'
import { formatCurrency, formatDate } from '@/lib/utils'
import type {
  ClientIntelligence,
  OpportuniteIA,
  PropositionIntelligente,
  Prospect,
  EffectifTranche,
} from '@/lib/types'
import OpportuniteModal from './OpportuniteModal'

interface ClientIntelligenceProfileProps {
  client: ClientIntelligence & { prospect: Prospect & { contacts?: Array<{ name: string; email: string | null; function: string | null; is_primary: boolean }> } }
  opportunites: OpportuniteIA[]
  propositions: PropositionIntelligente[]
}

const EFFECTIF_OPTIONS: EffectifTranche[] = ['moins_11', 'de_11_50', 'de_50_250', 'plus_250']

export default function ClientIntelligenceProfile({
  client,
  opportunites,
  propositions,
}: ClientIntelligenceProfileProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [detectingId, setDetectingId] = useState<string | null>(null)
  const [selectedOpp, setSelectedOpp] = useState<OpportuniteIA | null>(null)
  const [generatingId, setGeneratingId] = useState<string | null>(null)

  const [form, setForm] = useState({
    secteur: client.secteur || '',
    code_naf: client.code_naf || '',
    idcc: client.idcc || '',
    effectif_tranche: client.effectif_tranche,
    services_souscrits: client.services_souscrits,
  })

  const [localOpps, setLocalOpps] = useState<OpportuniteIA[]>(opportunites)
  const [localScore, setLocalScore] = useState(client.score_opportunite)

  async function handleSave() {
    setSaving(true)
    try {
      await fetch(`/api/intelligence/clients/${client.prospect_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDetect() {
    setDetectingId('all')
    try {
      const res = await fetch('/api/intelligence/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospect_id: client.prospect_id }),
      })
      const data = await res.json()
      if (data.created > 0) {
        // Recharger les opportunités
        const oppsRes = await fetch(
          `/api/intelligence/opportunites?prospect_id=${client.prospect_id}`
        )
        const opps = await oppsRes.json()
        setLocalOpps(opps)
        setLocalScore(Math.min(localScore + data.created * 10, 100))
      }
    } finally {
      setDetectingId(null)
    }
  }

  async function handleGenerate(opp: OpportuniteIA) {
    setGeneratingId(opp.id)
    try {
      const res = await fetch('/api/intelligence/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunite_id: opp.id }),
      })
      const data = await res.json()
      const updated = { ...opp, email_genere: data.email, proposition_generee: data.proposition, statut: 'vue' as const }
      setLocalOpps((prev) => prev.map((o) => (o.id === opp.id ? updated : o)))
      setSelectedOpp(updated)
    } finally {
      setGeneratingId(null)
    }
  }

  async function handleStatutChange(oppId: string, statut: string) {
    await fetch(`/api/intelligence/opportunites/${oppId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut }),
    })
    setLocalOpps((prev) => prev.map((o) => (o.id === oppId ? { ...o, statut: statut as OpportuniteIA['statut'] } : o)))
  }

  function toggleService(service: string) {
    setForm((prev) => ({
      ...prev,
      services_souscrits: prev.services_souscrits.includes(service)
        ? prev.services_souscrits.filter((s) => s !== service)
        : [...prev.services_souscrits, service],
    }))
  }

  const primary = client.prospect.contacts?.find((c) => c.is_primary) || client.prospect.contacts?.[0]
  const activeOpps = localOpps.filter((o) => ['nouvelle', 'vue'].includes(o.statut))
  const proposedOpps = localOpps.filter((o) => o.statut === 'proposee')
  const convertedOpps = localOpps.filter((o) => o.statut === 'acceptee')
  const caPotentiel = activeOpps.reduce((s, o) => s + (o.ca_estime || 0), 0)

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {/* Back */}
      <Link
        href="/intelligence"
        className="inline-flex items-center gap-1.5 text-sm mb-5"
        style={{ color: '#6b7280' }}
      >
        <ChevronLeft size={16} />
        Retour à l'Intelligence Client
      </Link>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Colonne gauche — profil */}
        <div className="space-y-4">
          {/* Carte identité */}
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: '#f0f7ff' }}
                >
                  <Building2 size={20} style={{ color: '#1e2d3d' }} />
                </div>
                <div>
                  <h1 className="font-bold text-lg leading-tight" style={{ color: '#1e2d3d' }}>
                    {client.prospect.company_name}
                  </h1>
                  {client.prospect.siren && (
                    <p className="text-xs" style={{ color: '#6b7280' }}>
                      SIREN {client.prospect.siren}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setEditing(!editing)}
                className="p-2 rounded-lg"
                style={{ border: '1px solid #e5e5e3', color: '#6b7280' }}
              >
                {editing ? <X size={14} /> : <Edit3 size={14} />}
              </button>
            </div>

            {/* Score */}
            <div className="mb-4 p-3 rounded-xl" style={{ backgroundColor: '#fff7ed' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: '#e8842c' }}>
                  Score d'opportunité
                </span>
                <span className="text-lg font-bold" style={{ color: '#e8842c' }}>
                  {localScore}/100
                </span>
              </div>
              <div className="h-2 rounded-full" style={{ backgroundColor: '#fed7aa' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${localScore}%`, backgroundColor: '#e8842c' }}
                />
              </div>
            </div>

            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#6b7280' }}>
                    Secteur d'activité
                  </label>
                  <input
                    value={form.secteur}
                    onChange={(e) => setForm({ ...form, secteur: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                    style={{ border: '1px solid #e5e5e3', color: '#1e2d3d' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: '#6b7280' }}>
                      Code NAF
                    </label>
                    <input
                      value={form.code_naf}
                      onChange={(e) => setForm({ ...form, code_naf: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                      style={{ border: '1px solid #e5e5e3', color: '#1e2d3d' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: '#6b7280' }}>
                      IDCC
                    </label>
                    <input
                      value={form.idcc}
                      onChange={(e) => setForm({ ...form, idcc: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                      style={{ border: '1px solid #e5e5e3', color: '#1e2d3d' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: '#6b7280' }}>
                    Effectif
                  </label>
                  <select
                    value={form.effectif_tranche}
                    onChange={(e) =>
                      setForm({ ...form, effectif_tranche: e.target.value as EffectifTranche })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                    style={{ border: '1px solid #e5e5e3', color: '#1e2d3d' }}
                  >
                    {EFFECTIF_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {EFFECTIF_LABELS[o]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-2" style={{ color: '#6b7280' }}>
                    Services souscrits
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_SERVICES.map((s) => {
                      const active = form.services_souscrits.includes(s)
                      return (
                        <button
                          key={s}
                          onClick={() => toggleService(s)}
                          className="text-xs px-2.5 py-1 rounded-full font-medium transition-all"
                          style={{
                            backgroundColor: active ? '#1e2d3d' : '#f0f0ee',
                            color: active ? '#fff' : '#6b7280',
                          }}
                        >
                          {SERVICE_LABELS[s]}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ backgroundColor: '#e8842c', opacity: saving ? 0.7 : 1 }}
                >
                  <Save size={14} />
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span style={{ color: '#6b7280' }}>Secteur</span>
                  <span className="font-medium text-right max-w-[60%] truncate" style={{ color: '#1e2d3d' }}>
                    {client.secteur || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: '#6b7280' }}>Code NAF</span>
                  <span className="font-medium" style={{ color: '#1e2d3d' }}>
                    {client.code_naf || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: '#6b7280' }}>IDCC</span>
                  <span className="font-medium" style={{ color: '#1e2d3d' }}>
                    {client.idcc ? `IDCC ${client.idcc}` : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: '#6b7280' }}>Effectif</span>
                  <span className="font-medium" style={{ color: '#1e2d3d' }}>
                    {EFFECTIF_LABELS[client.effectif_tranche]}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Services */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
          >
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#1e2d3d' }}>
              Carte des services
            </h3>
            <div className="space-y-2">
              {ALL_SERVICES.map((s) => {
                const souscrit = client.services_souscrits.includes(s)
                return (
                  <div key={s} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: '#6b7280' }}>
                      {SERVICE_LABELS[s]}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: souscrit ? '#ecfdf5' : '#fef2f2',
                        color: souscrit ? '#10b981' : '#ef4444',
                      }}
                    >
                      {souscrit ? '✓ Souscrit' : '✗ Non souscrit'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Stats rapides */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: '#1e2d3d', color: 'white' }}
          >
            <h3 className="text-sm font-semibold mb-3 opacity-70">CA Potentiel détecté</h3>
            <p className="text-3xl font-bold" style={{ color: '#e8842c' }}>
              {formatCurrency(caPotentiel)}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold">{activeOpps.length}</p>
                <p className="text-xs opacity-50">Actives</p>
              </div>
              <div>
                <p className="text-lg font-bold">{proposedOpps.length}</p>
                <p className="text-xs opacity-50">Proposées</p>
              </div>
              <div>
                <p className="text-lg font-bold">{convertedOpps.length}</p>
                <p className="text-xs opacity-50">Converties</p>
              </div>
            </div>
          </div>

          {/* Contact */}
          {primary && (
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
            >
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#1e2d3d' }}>
                Contact principal
              </h3>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: '#f0f7ff', color: '#1e2d3d' }}
                >
                  {primary.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#1e2d3d' }}>
                    {primary.name}
                  </p>
                  <p className="text-xs" style={{ color: '#6b7280' }}>
                    {primary.function || '—'}
                  </p>
                  {primary.email && (
                    <a
                      href={`mailto:${primary.email}`}
                      className="text-xs flex items-center gap-1 mt-0.5"
                      style={{ color: '#e8842c' }}
                    >
                      <Mail size={10} />
                      {primary.email}
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Colonne principale — opportunités */}
        <div className="xl:col-span-2 space-y-4">
          {/* Header opportunités */}
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base" style={{ color: '#1e2d3d' }}>
              Opportunités détectées
            </h2>
            <button
              onClick={handleDetect}
              disabled={detectingId !== null}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium text-white"
              style={{
                backgroundColor: '#e8842c',
                opacity: detectingId !== null ? 0.7 : 1,
              }}
            >
              <RefreshCw size={12} className={detectingId !== null ? 'animate-spin' : ''} />
              Détecter nouvelles opportunités
            </button>
          </div>

          {/* Liste des opportunités */}
          <div className="space-y-3">
            {localOpps.length === 0 && (
              <div
                className="rounded-xl p-8 text-center"
                style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
              >
                <Brain size={32} className="mx-auto mb-3" style={{ color: '#e5e5e3' }} />
                <p className="text-sm" style={{ color: '#6b7280' }}>
                  Aucune opportunité détectée pour ce client.
                </p>
                <button
                  onClick={handleDetect}
                  className="mt-3 text-sm font-medium underline"
                  style={{ color: '#e8842c' }}
                >
                  Lancer l'analyse
                </button>
              </div>
            )}

            {localOpps.map((opp) => (
              <div
                key={opp.id}
                className="rounded-xl p-4"
                style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{opportuniteTypeIcon(opp.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold leading-tight" style={{ color: '#1e2d3d' }}>
                        {opp.titre}
                      </h3>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                        style={{
                          backgroundColor: opportuniteStatutBg(opp.statut),
                          color: opportuniteStatutColor(opp.statut),
                        }}
                      >
                        {OPPORTUNITE_STATUT_LABELS[opp.statut]}
                      </span>
                    </div>
                    <p className="text-xs mt-1.5 leading-relaxed" style={{ color: '#6b7280' }}>
                      {opp.description.length > 150
                        ? opp.description.substring(0, 150) + '...'
                        : opp.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: '#f0f0ee', color: '#6b7280' }}
                      >
                        {OPPORTUNITE_TYPE_LABELS[opp.type]}
                      </span>
                      <span className="text-xs font-semibold" style={{ color: '#e8842c' }}>
                        {formatCurrency(opp.ca_estime)}
                      </span>
                      <span className="text-xs" style={{ color: '#9ca3af' }}>
                        {SERVICE_LABELS[opp.service_propose]}
                      </span>
                      <span className="text-xs" style={{ color: '#9ca3af' }}>
                        {formatDate(opp.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid #f0f0ee' }}>
                  {!opp.email_genere ? (
                    <button
                      onClick={() => handleGenerate(opp)}
                      disabled={generatingId === opp.id}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium text-white"
                      style={{
                        backgroundColor: '#e8842c',
                        opacity: generatingId === opp.id ? 0.7 : 1,
                      }}
                    >
                      <Brain size={12} className={generatingId === opp.id ? 'animate-pulse' : ''} />
                      {generatingId === opp.id ? 'Génération...' : 'Générer email + proposition'}
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedOpp(opp)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                      style={{
                        border: '1px solid #e5e5e3',
                        color: '#1e2d3d',
                      }}
                    >
                      <Eye size={12} />
                      Voir email + proposition
                    </button>
                  )}

                  {/* Changement de statut */}
                  <select
                    value={opp.statut}
                    onChange={(e) => handleStatutChange(opp.id, e.target.value)}
                    className="text-xs px-2 py-1.5 rounded-lg outline-none ml-auto"
                    style={{ border: '1px solid #e5e5e3', color: '#6b7280' }}
                  >
                    {(['nouvelle', 'vue', 'proposee', 'acceptee', 'refusee', 'expiree'] as const).map(
                      (s) => (
                        <option key={s} value={s}>
                          {OPPORTUNITE_STATUT_LABELS[s]}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* Historique propositions */}
          {propositions.length > 0 && (
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
            >
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#1e2d3d' }}>
                <FileText size={14} />
                Historique des propositions envoyées
              </h3>
              <div className="space-y-2">
                {propositions.map((prop) => (
                  <div
                    key={prop.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: '#f8f8f6' }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#1e2d3d' }}>
                        {prop.opportunite?.titre || 'Proposition'}
                      </p>
                      <p className="text-xs" style={{ color: '#6b7280' }}>
                        {formatDate(prop.date_envoi)} · Canal : {prop.canal}
                      </p>
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor:
                          prop.resultat === 'converti'
                            ? '#ecfdf5'
                            : prop.resultat === 'refuse'
                            ? '#fef2f2'
                            : prop.resultat === 'interesse'
                            ? '#eff6ff'
                            : '#f9fafb',
                        color:
                          prop.resultat === 'converti'
                            ? '#10b981'
                            : prop.resultat === 'refuse'
                            ? '#ef4444'
                            : prop.resultat === 'interesse'
                            ? '#3b82f6'
                            : '#6b7280',
                      }}
                    >
                      {prop.resultat === 'converti'
                        ? '✓ Converti'
                        : prop.resultat === 'refuse'
                        ? '✗ Refusé'
                        : prop.resultat === 'interesse'
                        ? '→ Intéressé'
                        : '⏳ En attente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal email/proposition */}
      {selectedOpp && (
        <OpportuniteModal
          opportunite={selectedOpp}
          onClose={() => setSelectedOpp(null)}
        />
      )}
    </div>
  )
}
