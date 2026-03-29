'use client'

import React, { useState } from 'react'
import { X, Copy, Check, TrendingUp, FileText, Mail, ChevronRight } from 'lucide-react'
import type { OpportuniteIA } from '@/lib/types'
import { getTypeLabel, getStatutLabel, getServiceLabel } from '@/lib/intelligence/engine'

interface OpportuniteModalProps {
  opportunite: OpportuniteIA
  onClose: () => void
  onStatutChange?: (id: string, statut: string) => void
  onGenerate?: (id: string) => Promise<void>
}

const TYPE_COLORS: Record<string, string> = {
  services_manquants: '#e8842c',
  saisonnalite: '#3b82f6',
  actu_juridique: '#8b5cf6',
}

const STATUT_COLORS: Record<string, string> = {
  nouvelle: '#e8842c',
  en_cours: '#3b82f6',
  gagnee: '#10b981',
  perdue: '#ef4444',
  ignoree: '#6b7280',
}

export default function OpportuniteModal({ opportunite, onClose, onStatutChange, onGenerate }: OpportuniteModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'email' | 'proposition'>('details')
  const [copied, setCopied] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [statut, setStatut] = useState(opportunite.statut)

  async function handleCopy(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  async function handleGenerate() {
    if (!onGenerate) return
    setGenerating(true)
    try {
      await onGenerate(opportunite.id)
    } finally {
      setGenerating(false)
    }
  }

  function handleStatutChange(newStatut: string) {
    setStatut(newStatut as typeof statut)
    onStatutChange?.(opportunite.id, newStatut)
  }

  const typeColor = TYPE_COLORS[opportunite.type] ?? '#6b7280'
  const statutColor = STATUT_COLORS[statut] ?? '#6b7280'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden" style={{ backgroundColor: '#ffffff', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="px-6 py-4 flex items-start justify-between gap-4" style={{ borderBottom: '1px solid #e5e5e3', flexShrink: 0 }}>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: typeColor }}>
                {getTypeLabel(opportunite.type)}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: statutColor }}>
                {getStatutLabel(statut)}
              </span>
            </div>
            <h2 className="text-base font-semibold" style={{ color: '#1e2d3d' }}>{opportunite.titre}</h2>
            {opportunite.organisation_nom && (
              <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>{opportunite.organisation_nom}</p>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 flex-shrink-0">
            <X size={18} style={{ color: '#6b7280' }} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 gap-1" style={{ borderBottom: '1px solid #e5e5e3', flexShrink: 0 }}>
          {[
            { key: 'details', label: 'Détails', icon: TrendingUp },
            { key: 'email', label: 'Email', icon: Mail },
            { key: 'proposition', label: 'Proposition', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className="flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors"
                style={{
                  borderBottomColor: activeTab === tab.key ? '#e8842c' : 'transparent',
                  color: activeTab === tab.key ? '#e8842c' : '#6b7280',
                }}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* CA Estimé */}
              <div className="rounded-xl p-4 flex items-center justify-between" style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}>
                <span className="text-sm font-medium" style={{ color: '#1e2d3d' }}>CA potentiel estimé</span>
                <span className="text-lg font-bold" style={{ color: '#e8842c' }}>
                  {opportunite.ca_estime.toLocaleString('fr-FR')} € HT
                </span>
              </div>

              {/* Description */}
              {opportunite.description && (
                <div>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: '#1e2d3d' }}>Description</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>{opportunite.description}</p>
                </div>
              )}

              {/* Service proposé */}
              {opportunite.service_propose && (
                <div>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: '#1e2d3d' }}>Service proposé</h3>
                  <span className="inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full font-medium" style={{ backgroundColor: '#fff7ed', color: '#e8842c' }}>
                    <ChevronRight size={12} />
                    {getServiceLabel(opportunite.service_propose)}
                  </span>
                </div>
              )}

              {/* Changer le statut */}
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: '#1e2d3d' }}>Changer le statut</h3>
                <div className="flex flex-wrap gap-2">
                  {(['nouvelle', 'en_cours', 'gagnee', 'perdue', 'ignoree'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatutChange(s)}
                      className="text-xs px-3 py-1.5 rounded-full font-medium border transition-all"
                      style={{
                        backgroundColor: statut === s ? STATUT_COLORS[s] : 'transparent',
                        color: statut === s ? '#ffffff' : STATUT_COLORS[s],
                        borderColor: STATUT_COLORS[s],
                      }}
                    >
                      {getStatutLabel(s)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-4">
              {opportunite.email_genere ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold" style={{ color: '#1e2d3d' }}>Email personnalisé</h3>
                    <button
                      onClick={() => handleCopy(opportunite.email_genere!, 'email')}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
                      style={{ backgroundColor: '#f8f8f6', color: '#6b7280' }}
                    >
                      {copied === 'email' ? <Check size={12} /> : <Copy size={12} />}
                      {copied === 'email' ? 'Copié !' : 'Copier'}
                    </button>
                  </div>
                  <pre className="text-xs whitespace-pre-wrap leading-relaxed p-4 rounded-xl" style={{ backgroundColor: '#f8f8f6', color: '#1e2d3d', fontFamily: 'inherit' }}>
                    {opportunite.email_genere}
                  </pre>
                </>
              ) : (
                <div className="text-center py-8">
                  <Mail size={32} className="mx-auto mb-3" style={{ color: '#e5e5e3' }} />
                  <p className="text-sm mb-4" style={{ color: '#6b7280' }}>Email non encore généré</p>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                    style={{ backgroundColor: '#e8842c' }}
                  >
                    {generating ? 'Génération…' : 'Générer l\'email'}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'proposition' && (
            <div className="space-y-4">
              {opportunite.proposition_generee ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold" style={{ color: '#1e2d3d' }}>Proposition commerciale</h3>
                    <button
                      onClick={() => handleCopy(opportunite.proposition_generee!, 'proposition')}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
                      style={{ backgroundColor: '#f8f8f6', color: '#6b7280' }}
                    >
                      {copied === 'proposition' ? <Check size={12} /> : <Copy size={12} />}
                      {copied === 'proposition' ? 'Copié !' : 'Copier'}
                    </button>
                  </div>
                  <pre className="text-xs whitespace-pre-wrap leading-relaxed p-4 rounded-xl" style={{ backgroundColor: '#f8f8f6', color: '#1e2d3d', fontFamily: 'inherit' }}>
                    {opportunite.proposition_generee}
                  </pre>
                </>
              ) : (
                <div className="text-center py-8">
                  <FileText size={32} className="mx-auto mb-3" style={{ color: '#e5e5e3' }} />
                  <p className="text-sm mb-4" style={{ color: '#6b7280' }}>Proposition non encore générée</p>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                    style={{ backgroundColor: '#e8842c' }}
                  >
                    {generating ? 'Génération…' : 'Générer la proposition'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-between gap-3" style={{ borderTop: '1px solid #e5e5e3', flexShrink: 0 }}>
          <p className="text-xs" style={{ color: '#6b7280' }}>
            Créé le {new Date(opportunite.created_at).toLocaleDateString('fr-FR')}
          </p>
          <div className="flex gap-2">
            {onGenerate && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: '#e8842c' }}
              >
                {generating ? 'Génération…' : 'Générer email + proposition'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium border"
              style={{ borderColor: '#e5e5e3', color: '#6b7280' }}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
