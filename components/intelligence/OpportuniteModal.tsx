'use client'

import React, { useState } from 'react'
import { X, Mail, FileText, TrendingUp, Loader2, Check } from 'lucide-react'
import type { OpportuniteIA } from '@/lib/types'
import { SERVICES } from '@/lib/intelligence/engine'

interface Props {
  opportunite: OpportuniteIA & { prospect?: { company_name: string } }
  onClose: () => void
  onStatutChange: (id: string, statut: string) => void
}

const STATUTS = [
  { value: 'nouvelle', label: 'Nouvelle', color: '#3b82f6' },
  { value: 'en_cours', label: 'En cours', color: '#f59e0b' },
  { value: 'proposee', label: 'Proposée', color: '#8b5cf6' },
  { value: 'gagnee', label: 'Gagnée', color: '#10b981' },
  { value: 'perdue', label: 'Perdue', color: '#ef4444' },
  { value: 'ignoree', label: 'Ignorée', color: '#6b7280' },
]

export default function OpportuniteModal({ opportunite, onClose, onStatutChange }: Props) {
  const [tab, setTab] = useState<'details' | 'email' | 'proposition'>('details')
  const [generating, setGenerating] = useState(false)
  const [emailData, setEmailData] = useState<{ sujet: string; corps: string } | null>(null)
  const [propositionData, setPropositionData] = useState<Record<string, unknown> | null>(null)
  const [copied, setCopied] = useState(false)

  const serviceConfig = SERVICES[opportunite.service_propose as keyof typeof SERVICES]
  const statutConfig = STATUTS.find(s => s.value === opportunite.statut)

  async function handleGenerate() {
    setGenerating(true)
    try {
      const res = await fetch('/api/intelligence/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunite_id: opportunite.id }),
      })
      const data = await res.json()
      if (data.email) setEmailData(data.email)
      if (data.proposition) setPropositionData(data.proposition)
      setTab('email')
    } finally {
      setGenerating(false)
    }
  }

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleStatutChange(statut: string) {
    await fetch(`/api/intelligence/opportunites/${opportunite.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut }),
    })
    onStatutChange(opportunite.id, statut)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: '#fff', maxHeight: '90vh', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6" style={{ borderBottom: '1px solid #e5e5e3' }}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: statutConfig?.color + '20', color: statutConfig?.color }}
              >
                {statutConfig?.label}
              </span>
              <span className="text-xs" style={{ color: '#6b7280' }}>
                {opportunite.prospect?.company_name}
              </span>
            </div>
            <h2 className="text-lg font-semibold truncate" style={{ color: '#1e2d3d' }}>
              {opportunite.titre}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>
              {serviceConfig?.label ?? opportunite.service_propose} — {opportunite.ca_estime.toLocaleString('fr-FR')} € HT
            </p>
          </div>
          <button onClick={onClose} className="ml-4 p-1.5 rounded-lg hover:bg-gray-100">
            <X size={18} style={{ color: '#6b7280' }} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4" style={{ borderBottom: '1px solid #e5e5e3' }}>
          {[
            { key: 'details', label: 'Détails', icon: TrendingUp },
            { key: 'email', label: 'Email', icon: Mail },
            { key: 'proposition', label: 'Proposition', icon: FileText },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as typeof tab)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors"
              style={{
                color: tab === key ? '#e8842c' : '#6b7280',
                borderBottom: tab === key ? '2px solid #e8842c' : '2px solid transparent',
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'details' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: '#1e2d3d' }}>Description</p>
                <p className="text-sm" style={{ color: '#6b7280' }}>{opportunite.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#f8f8f6' }}>
                  <p className="text-xs" style={{ color: '#6b7280' }}>CA estimé</p>
                  <p className="text-lg font-bold" style={{ color: '#1e2d3d' }}>
                    {opportunite.ca_estime.toLocaleString('fr-FR')} €
                  </p>
                </div>
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#f8f8f6' }}>
                  <p className="text-xs" style={{ color: '#6b7280' }}>Type</p>
                  <p className="text-sm font-medium capitalize" style={{ color: '#1e2d3d' }}>
                    {opportunite.type.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: '#1e2d3d' }}>Changer le statut</p>
                <div className="flex flex-wrap gap-2">
                  {STATUTS.map(s => (
                    <button
                      key={s.value}
                      onClick={() => handleStatutChange(s.value)}
                      className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                      style={{
                        backgroundColor: opportunite.statut === s.value ? s.color : s.color + '15',
                        color: opportunite.statut === s.value ? '#fff' : s.color,
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'email' && (
            <div className="space-y-4">
              {!emailData ? (
                <div className="text-center py-8">
                  <Mail size={32} className="mx-auto mb-3" style={{ color: '#e5e5e3' }} />
                  <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
                    L&apos;email n&apos;a pas encore été généré pour cette opportunité.
                  </p>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl text-sm font-medium text-white"
                    style={{ backgroundColor: '#e8842c' }}
                  >
                    {generating ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                    Générer l&apos;email
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium" style={{ color: '#1e2d3d' }}>Email généré</p>
                    <button
                      onClick={() => handleCopy(`Sujet : ${emailData.sujet}\n\n${emailData.corps}`)}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                      style={{ backgroundColor: '#f8f8f6', color: '#6b7280' }}
                    >
                      {copied ? <Check size={12} /> : null}
                      {copied ? 'Copié !' : 'Copier'}
                    </button>
                  </div>
                  <div className="p-3 rounded-xl text-xs mb-3" style={{ backgroundColor: '#f8f8f6', color: '#6b7280' }}>
                    <strong>Sujet :</strong> {emailData.sujet}
                  </div>
                  <pre className="text-xs p-4 rounded-xl overflow-auto whitespace-pre-wrap" style={{ backgroundColor: '#f8f8f6', color: '#374151', maxHeight: '300px' }}>
                    {emailData.corps}
                  </pre>
                </div>
              )}
            </div>
          )}

          {tab === 'proposition' && (
            <div className="space-y-4">
              {!propositionData ? (
                <div className="text-center py-8">
                  <FileText size={32} className="mx-auto mb-3" style={{ color: '#e5e5e3' }} />
                  <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
                    La proposition commerciale n&apos;a pas encore été générée.
                  </p>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl text-sm font-medium text-white"
                    style={{ backgroundColor: '#e8842c' }}
                  >
                    {generating ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                    Générer la proposition
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm" style={{ color: '#1e2d3d' }}>
                    {String(propositionData.titre ?? '')}
                  </h3>
                  <p className="text-xs" style={{ color: '#6b7280' }}>
                    {String(propositionData.introduction ?? '')}
                  </p>
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: '#1e2d3d' }}>Livrables</p>
                    <ul className="space-y-1">
                      {(propositionData.livrables as string[] ?? []).map((l: string, i: number) => (
                        <li key={i} className="text-xs flex gap-2" style={{ color: '#6b7280' }}>
                          <span style={{ color: '#e8842c' }}>•</span> {l}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-xl text-center" style={{ backgroundColor: '#f8f8f6' }}>
                      <p className="text-xs" style={{ color: '#6b7280' }}>HT</p>
                      <p className="text-sm font-bold" style={{ color: '#1e2d3d' }}>
                        {Number(propositionData.budget_ht ?? 0).toLocaleString('fr-FR')} €
                      </p>
                    </div>
                    <div className="p-2 rounded-xl text-center" style={{ backgroundColor: '#f8f8f6' }}>
                      <p className="text-xs" style={{ color: '#6b7280' }}>TVA 20%</p>
                      <p className="text-sm font-bold" style={{ color: '#1e2d3d' }}>
                        {Number(propositionData.tva ?? 0).toLocaleString('fr-FR')} €
                      </p>
                    </div>
                    <div className="p-2 rounded-xl text-center" style={{ backgroundColor: '#e8842c' }}>
                      <p className="text-xs text-white opacity-80">TTC</p>
                      <p className="text-sm font-bold text-white">
                        {Number(propositionData.budget_ttc ?? 0).toLocaleString('fr-FR')} €
                      </p>
                    </div>
                  </div>
                  <p className="text-xs" style={{ color: '#6b7280' }}>
                    <strong>Calendrier :</strong> {String(propositionData.calendrier ?? '')}
                  </p>
                  <p className="text-xs" style={{ color: '#6b7280' }}>
                    <strong>Validité :</strong> {String(propositionData.validite ?? '')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: '1px solid #e5e5e3' }}>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ backgroundColor: '#e8842c' }}
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
            {emailData ? 'Régénérer' : 'Générer email + proposition'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ backgroundColor: '#f8f8f6', color: '#6b7280' }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
