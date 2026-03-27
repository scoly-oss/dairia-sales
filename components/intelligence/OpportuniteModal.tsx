'use client'

import React, { useState } from 'react'
import { X, Mail, FileText, Loader2, CheckCircle, ExternalLink } from 'lucide-react'
import type { OpportuniteIA, ClientIntelligence } from '@/lib/types'
import {
  serviceLabel,
  opportuniteStatutLabel,
  opportuniteStatutColor,
} from '@/lib/intelligence/engine'

interface Props {
  opportunite: OpportuniteIA
  ci?: ClientIntelligence
  onClose: () => void
  onStatutChange: (id: string, statut: OpportuniteIA['statut']) => void
}

export default function OpportuniteModal({ opportunite, onClose, onStatutChange }: Props) {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState<{ sujet: string; corps: string } | null>(null)
  const [proposition, setProposition] = useState<Record<string, unknown> | null>(null)
  const [activeTab, setActiveTab] = useState<'detail' | 'email' | 'proposition'>('detail')
  const [copied, setCopied] = useState(false)

  async function handleGenerer() {
    setLoading(true)
    try {
      const res = await fetch('/api/intelligence/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunite_id: opportunite.id }),
      })
      const data = await res.json()
      if (data.email) {
        setEmail(data.email)
        setProposition(data.proposition)
        setActiveTab('email')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleStatut(statut: OpportuniteIA['statut']) {
    await fetch(`/api/intelligence/opportunites/${opportunite.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut }),
    })
    onStatutChange(opportunite.id, statut)
    onClose()
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const statusColor = opportuniteStatutColor(opportunite.statut)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: '#ffffff', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-6 py-5"
          style={{ borderBottom: '1px solid #e5e5e3' }}
        >
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: statusColor + '20', color: statusColor }}
              >
                {opportuniteStatutLabel(opportunite.statut)}
              </span>
              <span className="text-xs" style={{ color: '#6b7280' }}>
                {serviceLabel(opportunite.service_propose)}
              </span>
            </div>
            <h2 className="text-lg font-semibold" style={{ color: '#1e2d3d' }}>
              {opportunite.titre}
            </h2>
            {opportunite.prospect && (
              <div className="text-sm mt-0.5" style={{ color: '#6b7280' }}>
                {(opportunite.prospect as { company_name?: string }).company_name}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <X size={18} style={{ color: '#6b7280' }} />
          </button>
        </div>

        {/* Tabs */}
        <div
          className="flex"
          style={{ borderBottom: '1px solid #e5e5e3' }}
        >
          {(['detail', 'email', 'proposition'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-5 py-3 text-sm font-medium transition-colors"
              style={{
                borderBottom: activeTab === tab ? '2px solid #e8842c' : '2px solid transparent',
                color: activeTab === tab ? '#e8842c' : '#6b7280',
              }}
            >
              {tab === 'detail' ? 'Détail' : tab === 'email' ? 'Email' : 'Proposition'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'detail' && (
            <div className="space-y-4">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#6b7280' }}>
                  Description
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#1e2d3d' }}>
                  {opportunite.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div
                  className="rounded-xl p-4"
                  style={{ backgroundColor: '#f8f8f6', border: '1px solid #e5e5e3' }}
                >
                  <div className="text-xs" style={{ color: '#6b7280' }}>CA estimé</div>
                  <div className="text-xl font-bold mt-1" style={{ color: '#e8842c' }}>
                    {opportunite.ca_estime?.toLocaleString('fr-FR')} €
                  </div>
                </div>
                <div
                  className="rounded-xl p-4"
                  style={{ backgroundColor: '#f8f8f6', border: '1px solid #e5e5e3' }}
                >
                  <div className="text-xs" style={{ color: '#6b7280' }}>Service proposé</div>
                  <div className="text-sm font-semibold mt-1" style={{ color: '#1e2d3d' }}>
                    {serviceLabel(opportunite.service_propose)}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  onClick={handleGenerer}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#e8842c' }}
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
                  Générer email + proposition
                </button>

                {opportunite.statut !== 'convertie' && (
                  <button
                    onClick={() => handleStatut('convertie')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                    style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}
                  >
                    <CheckCircle size={15} />
                    Marquer converti
                  </button>
                )}

                {opportunite.statut !== 'ignoree' && (
                  <button
                    onClick={() => handleStatut('ignoree')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                    style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}
                  >
                    Ignorer
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-4">
              {!email && !opportunite.email_genere ? (
                <div className="text-center py-8" style={{ color: '#6b7280' }}>
                  <Mail size={32} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm">
                    Cliquez sur &quot;Générer email + proposition&quot; dans l&apos;onglet Détail
                  </p>
                </div>
              ) : (
                <>
                  {(email?.sujet || opportunite.email_genere) && (
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#6b7280' }}>
                        Email personnalisé
                      </div>
                      <div
                        className="rounded-xl p-4 text-sm whitespace-pre-wrap"
                        style={{ backgroundColor: '#f8f8f6', color: '#1e2d3d', border: '1px solid #e5e5e3', lineHeight: '1.6' }}
                      >
                        {email
                          ? `Sujet : ${email.sujet}\n\n${email.corps}`
                          : opportunite.email_genere}
                      </div>
                      <button
                        onClick={() => handleCopy(
                          email
                            ? `Sujet : ${email.sujet}\n\n${email.corps}`
                            : opportunite.email_genere ?? ''
                        )}
                        className="mt-2 flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-colors"
                        style={{ backgroundColor: copied ? '#dcfce7' : '#f3f4f6', color: copied ? '#16a34a' : '#6b7280' }}
                      >
                        {copied ? <CheckCircle size={12} /> : <ExternalLink size={12} />}
                        {copied ? 'Copié !' : 'Copier le texte'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'proposition' && (
            <div className="space-y-4">
              {!proposition && !opportunite.proposition_generee ? (
                <div className="text-center py-8" style={{ color: '#6b7280' }}>
                  <FileText size={32} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm">
                    Cliquez sur &quot;Générer email + proposition&quot; dans l&apos;onglet Détail
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(() => {
                    const prop = proposition ?? (opportunite.proposition_generee ? JSON.parse(opportunite.proposition_generee) : null)
                    if (!prop) return null
                    return (
                      <>
                        <h3 className="font-semibold" style={{ color: '#1e2d3d' }}>{prop.titre}</h3>
                        <div>
                          <div className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: '#6b7280' }}>Contexte</div>
                          <p className="text-sm" style={{ color: '#1e2d3d' }}>{prop.contexte}</p>
                        </div>
                        <div>
                          <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#6b7280' }}>Livrables</div>
                          <ul className="space-y-1">
                            {(prop.livrables as string[]).map((l: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#1e2d3d' }}>
                                <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                                {l}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: '#6b7280' }}>Calendrier</div>
                          <p className="text-sm" style={{ color: '#1e2d3d' }}>{prop.calendrier}</p>
                        </div>
                        <div
                          className="rounded-xl p-4"
                          style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}
                        >
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div>
                              <div className="text-xs" style={{ color: '#6b7280' }}>HT</div>
                              <div className="font-bold" style={{ color: '#e8842c' }}>{Number(prop.budget_ht).toLocaleString('fr-FR')} €</div>
                            </div>
                            <div>
                              <div className="text-xs" style={{ color: '#6b7280' }}>TVA 20%</div>
                              <div className="font-semibold" style={{ color: '#1e2d3d' }}>{Number(prop.budget_tva).toLocaleString('fr-FR')} €</div>
                            </div>
                            <div>
                              <div className="text-xs" style={{ color: '#6b7280' }}>TTC</div>
                              <div className="font-bold text-lg" style={{ color: '#1e2d3d' }}>{Number(prop.budget_ttc).toLocaleString('fr-FR')} €</div>
                            </div>
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
