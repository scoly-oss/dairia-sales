'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, Sparkles, Eye, Check, CheckCircle, XCircle } from 'lucide-react'
import type { ClientIntelligence, OpportuniteIA } from '@/lib/types'
import { getServiceLabel, getStatutLabel, getTypeLabel, getEffectifLabel, SERVICES } from '@/lib/intelligence/engine'
import OpportuniteModal from './OpportuniteModal'

interface ClientIntelligenceProfileProps {
  client: ClientIntelligence
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

export default function ClientIntelligenceProfile({ client: initialClient }: ClientIntelligenceProfileProps) {
  const [client, setClient] = useState(initialClient)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [selectedOpp, setSelectedOpp] = useState<OpportuniteIA | null>(null)
  const [opps, setOpps] = useState<OpportuniteIA[]>(initialClient.opportunites ?? [])

  const [form, setForm] = useState({
    organisation_nom: client.organisation_nom,
    secteur: client.secteur ?? '',
    code_naf: client.code_naf ?? '',
    idcc: client.idcc ?? '',
    idcc_libelle: client.idcc_libelle ?? '',
    effectif_tranche: client.effectif_tranche ?? '',
  })

  const [servicesSouscrits, setServicesSouscrits] = useState<string[]>(client.services_souscrits)

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/intelligence/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          effectif_tranche: form.effectif_tranche || null,
          services_souscrits: servicesSouscrits,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setClient(updated)
        setEditing(false)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDetect() {
    setDetecting(true)
    try {
      const res = await fetch('/api/intelligence/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: client.id }),
      })
      const data = await res.json()
      if (data.created > 0) {
        const oppRes = await fetch(`/api/intelligence/opportunites?client_id=${client.id}`)
        const newOpps = await oppRes.json()
        setOpps(Array.isArray(newOpps) ? newOpps : [])
        const ciRes = await fetch(`/api/intelligence/clients/${client.id}`)
        if (ciRes.ok) setClient(await ciRes.json())
      }
      alert(`${data.created} nouvelle(s) opportunité(s) détectée(s)`)
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

  function toggleService(key: string) {
    setServicesSouscrits((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    )
  }

  // Score color
  const score = client.score_opportunite
  const scoreColor = score >= 70 ? '#ef4444' : score >= 40 ? '#e8842c' : '#10b981'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/intelligence" className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft size={18} style={{ color: '#6b7280' }} />
          </Link>
          <div>
            <h1 className="text-lg font-bold" style={{ color: '#1e2d3d' }}>{client.organisation_nom}</h1>
            <p className="text-sm" style={{ color: '#6b7280' }}>
              {client.secteur ?? 'Secteur non renseigné'} · {getEffectifLabel(client.effectif_tranche)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Score */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: scoreColor }}>
              {score}
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: '#1e2d3d' }}>Score IA</p>
              <p className="text-xs" style={{ color: '#6b7280' }}>/100</p>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fiche client */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm" style={{ color: '#1e2d3d' }}>Profil enrichi</h2>
            <button
              onClick={() => (editing ? handleSave() : setEditing(true))}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: editing ? '#10b981' : '#e8842c' }}
            >
              {editing ? <><Save size={12} /> {saving ? 'Enreg…' : 'Enregistrer'}</> : <>Modifier</>}
            </button>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Organisation', key: 'organisation_nom' as const },
              { label: 'Secteur', key: 'secteur' as const },
              { label: 'Code NAF', key: 'code_naf' as const },
              { label: 'N° IDCC', key: 'idcc' as const },
              { label: 'Convention collective', key: 'idcc_libelle' as const },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="text-xs font-medium" style={{ color: '#6b7280' }}>{label}</label>
                {editing ? (
                  <input
                    value={form[key]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="mt-1 w-full text-sm px-3 py-2 rounded-lg border outline-none"
                    style={{ borderColor: '#e5e5e3', color: '#1e2d3d', backgroundColor: '#f8f8f6' }}
                  />
                ) : (
                  <p className="mt-0.5 text-sm" style={{ color: '#1e2d3d' }}>{(client[key] as string) || <span style={{ color: '#6b7280' }}>Non renseigné</span>}</p>
                )}
              </div>
            ))}

            <div>
              <label className="text-xs font-medium" style={{ color: '#6b7280' }}>Effectif</label>
              {editing ? (
                <select
                  value={form.effectif_tranche}
                  onChange={(e) => setForm((prev) => ({ ...prev, effectif_tranche: e.target.value }))}
                  className="mt-1 w-full text-sm px-3 py-2 rounded-lg border outline-none"
                  style={{ borderColor: '#e5e5e3', color: '#1e2d3d', backgroundColor: '#f8f8f6' }}
                >
                  <option value="">Non renseigné</option>
                  <option value="-11">Moins de 11 salariés</option>
                  <option value="11-50">11 à 50 salariés</option>
                  <option value="50-250">50 à 250 salariés</option>
                  <option value="250+">Plus de 250 salariés</option>
                </select>
              ) : (
                <p className="mt-0.5 text-sm" style={{ color: '#1e2d3d' }}>{getEffectifLabel(client.effectif_tranche)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Services souscrits / potentiels */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}>
          <h2 className="font-semibold text-sm mb-4" style={{ color: '#1e2d3d' }}>Services</h2>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(SERVICES).map(([key, label]) => {
              const souscrit = servicesSouscrits.includes(key)
              return (
                <button
                  key={key}
                  onClick={() => editing && toggleService(key)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${editing ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                  style={{
                    backgroundColor: souscrit ? '#f0fdf4' : '#f8f8f6',
                    border: `1px solid ${souscrit ? '#bbf7d0' : '#e5e5e3'}`,
                  }}
                >
                  {souscrit
                    ? <CheckCircle size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                    : <XCircle size={14} style={{ color: '#e5e5e3', flexShrink: 0 }} />
                  }
                  <span className="text-xs font-medium" style={{ color: souscrit ? '#10b981' : '#6b7280' }}>{label}</span>
                  {!souscrit && editing && (
                    <span className="ml-auto text-xs" style={{ color: '#e8842c' }}>+ Ajouter</span>
                  )}
                </button>
              )
            })}
          </div>
          {editing && (
            <p className="text-xs mt-3" style={{ color: '#6b7280' }}>Cliquez sur un service pour l'ajouter ou le retirer</p>
          )}
        </div>
      </div>

      {/* Opportunités */}
      <div className="rounded-2xl" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #e5e5e3' }}>
          <h2 className="font-semibold text-sm" style={{ color: '#1e2d3d' }}>
            Opportunités détectées <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#fff7ed', color: '#e8842c' }}>{opps.length}</span>
          </h2>
        </div>
        <div className="divide-y" style={{ borderColor: '#e5e5e3' }}>
          {opps.length === 0 && (
            <div className="py-10 text-center">
              <Sparkles size={28} className="mx-auto mb-2" style={{ color: '#e5e5e3' }} />
              <p className="text-sm" style={{ color: '#6b7280' }}>Aucune opportunité. Cliquez sur "Détecter" pour lancer l'analyse.</p>
            </div>
          )}
          {opps.map((opp) => (
            <div key={opp.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ backgroundColor: TYPE_COLORS[opp.type] ?? '#6b7280' }}>
                    {getTypeLabel(opp.type)}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ backgroundColor: STATUT_COLORS[opp.statut] ?? '#6b7280' }}>
                    {getStatutLabel(opp.statut)}
                  </span>
                  {(opp.email_genere || opp.proposition_generee) && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#f0fdf4', color: '#10b981' }}>
                      <Check size={10} className="inline mr-0.5" />Généré
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium" style={{ color: '#1e2d3d' }}>{opp.titre}</p>
                {opp.service_propose && (
                  <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{getServiceLabel(opp.service_propose)}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold" style={{ color: '#e8842c' }}>{opp.ca_estime.toLocaleString('fr-FR')} €</p>
              </div>
              <button onClick={() => setSelectedOpp(opp)} className="p-2 rounded-lg hover:bg-gray-100">
                <Eye size={16} style={{ color: '#6b7280' }} />
              </button>
            </div>
          ))}
        </div>
      </div>

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
