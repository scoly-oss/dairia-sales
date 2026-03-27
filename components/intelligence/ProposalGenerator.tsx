'use client'

import { useState } from 'react'
import { X, Sparkles, CheckCircle, Edit3, AlertTriangle, ChevronRight } from 'lucide-react'
import type { Deal, IaProposal } from '@/lib/types'

interface Props {
  deal: Deal
  onClose: () => void
  onValidated: (proposal: IaProposal) => void
}

type Step = 'idle' | 'generating' | 'review' | 'validated'

export default function ProposalGenerator({ deal, onClose, onValidated }: Props) {
  const [step, setStep] = useState<Step>('idle')
  const [error, setError] = useState('')
  const [proposal, setProposal] = useState<(IaProposal & { email_subject: string; email_body: string }) | null>(null)
  const [editedSubject, setEditedSubject] = useState('')
  const [editedBody, setEditedBody] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleGenerate() {
    setStep('generating')
    setError('')

    try {
      const res = await fetch('/api/intelligence/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deal_id: deal.id }),
      })

      const data = await res.json() as { proposal?: IaProposal & { email_subject: string; email_body: string }; error?: string }

      if (!res.ok || !data.proposal) {
        setError(data.error ?? 'Erreur lors de la génération')
        setStep('idle')
        return
      }

      setProposal(data.proposal)
      setEditedSubject(data.proposal.email_subject)
      setEditedBody(data.proposal.email_body)
      setStep('review')
    } catch {
      setError('Erreur réseau — veuillez réessayer')
      setStep('idle')
    }
  }

  async function handleValidate() {
    if (!proposal) return
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/intelligence/generate-proposal', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: proposal.id,
          modified_email_subject: editedSubject !== proposal.email_subject ? editedSubject : undefined,
          modified_email_body: editedBody !== proposal.email_body ? editedBody : undefined,
          status: 'validated',
        }),
      })

      const data = await res.json() as { proposal?: IaProposal; error?: string }

      if (!res.ok || !data.proposal) {
        setError(data.error ?? 'Erreur lors de la validation')
        setSaving(false)
        return
      }

      setStep('validated')
      onValidated(data.proposal)
    } catch {
      setError('Erreur réseau — veuillez réessayer')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = { border: '1px solid #e5e5e3', color: '#1e2d3d', backgroundColor: '#ffffff' }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: '#ffffff', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #e5e5e3' }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={18} style={{ color: '#e8842c' }} />
            <h2 className="text-base font-semibold" style={{ color: '#1e2d3d' }}>
              Intelligence IA — Proposition commerciale
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-50">
            <X size={18} style={{ color: '#6b7280' }} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Deal info */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: '#f8f8f6', border: '1px solid #e5e5e3' }}
          >
            <p className="text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Opportunité analysée</p>
            <p className="text-sm font-semibold" style={{ color: '#1e2d3d' }}>{deal.title}</p>
            {(deal as Deal & { prospect?: { company_name: string } }).prospect && (
              <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
                {(deal as Deal & { prospect?: { company_name: string } }).prospect?.company_name}
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div
              className="flex items-start gap-2 p-3 rounded-lg"
              style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}
            >
              <AlertTriangle size={14} style={{ color: '#dc2626', marginTop: 2 }} />
              <p className="text-sm" style={{ color: '#dc2626' }}>{error}</p>
            </div>
          )}

          {/* Step: idle */}
          {step === 'idle' && (
            <div className="text-center py-6 space-y-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
                style={{ backgroundColor: '#fff7ed' }}
              >
                <Sparkles size={24} style={{ color: '#e8842c' }} />
              </div>
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: '#1e2d3d' }}>
                  Générer une proposition personnalisée
                </p>
                <p className="text-xs" style={{ color: '#6b7280' }}>
                  Claude analyse le profil client, l'historique et génère un email
                  de proposition avec les arguments clés adaptés au contexte.
                </p>
              </div>
              <button
                onClick={handleGenerate}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: '#e8842c' }}
              >
                <Sparkles size={15} />
                Analyser et générer
              </button>
            </div>
          )}

          {/* Step: generating */}
          {step === 'generating' && (
            <div className="text-center py-8 space-y-3">
              <div className="flex justify-center">
                <div
                  className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: '#e8842c', borderTopColor: 'transparent' }}
                />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: '#1e2d3d' }}>
                  Claude analyse le profil client…
                </p>
                <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                  Cela peut prendre quelques secondes
                </p>
              </div>
            </div>
          )}

          {/* Step: review */}
          {step === 'review' && proposal && (
            <div className="space-y-5">
              {/* Key arguments */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#6b7280' }}>
                  Arguments clés
                </p>
                <div className="space-y-2">
                  {proposal.key_arguments.map((arg, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <ChevronRight size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#e8842c' }} />
                      <p className="text-sm" style={{ color: '#1e2d3d' }}>{arg}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Urgency & risk */}
              {(proposal.urgency_reason || proposal.risk_if_no_action) && (
                <div className="grid grid-cols-2 gap-3">
                  {proposal.urgency_reason && (
                    <div
                      className="rounded-xl p-3"
                      style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}
                    >
                      <p className="text-xs font-semibold mb-1" style={{ color: '#e8842c' }}>Pourquoi maintenant</p>
                      <p className="text-xs" style={{ color: '#1e2d3d' }}>{proposal.urgency_reason}</p>
                    </div>
                  )}
                  {proposal.risk_if_no_action && (
                    <div
                      className="rounded-xl p-3"
                      style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}
                    >
                      <p className="text-xs font-semibold mb-1" style={{ color: '#dc2626' }}>Risque si inaction</p>
                      <p className="text-xs" style={{ color: '#1e2d3d' }}>{proposal.risk_if_no_action}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Email preview / edit */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6b7280' }}>
                    Email généré
                  </p>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-1 text-xs font-medium"
                    style={{ color: '#e8842c' }}
                  >
                    <Edit3 size={12} />
                    {isEditing ? 'Aperçu' : 'Modifier'}
                  </button>
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Objet</label>
                      <input
                        value={editedSubject}
                        onChange={(e) => setEditedSubject(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Corps</label>
                      <textarea
                        value={editedBody}
                        onChange={(e) => setEditedBody(e.target.value)}
                        rows={10}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                ) : (
                  <div
                    className="rounded-xl p-4 space-y-3"
                    style={{ backgroundColor: '#f8f8f6', border: '1px solid #e5e5e3' }}
                  >
                    <div>
                      <p className="text-xs font-medium" style={{ color: '#6b7280' }}>Objet :</p>
                      <p className="text-sm font-medium mt-0.5" style={{ color: '#1e2d3d' }}>{editedSubject}</p>
                    </div>
                    <div style={{ borderTop: '1px solid #e5e5e3', paddingTop: 12 }}>
                      <p className="text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Corps :</p>
                      <pre
                        className="text-xs whitespace-pre-wrap font-sans"
                        style={{ color: '#1e2d3d', lineHeight: '1.6' }}
                      >
                        {editedBody}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setStep('idle'); setProposal(null) }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ border: '1px solid #e5e5e3', color: '#6b7280' }}
                >
                  Régénérer
                </button>
                <button
                  onClick={handleValidate}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ backgroundColor: saving ? '#f5a65c' : '#e8842c' }}
                >
                  <CheckCircle size={15} />
                  {saving ? 'Validation…' : 'Valider la proposition'}
                </button>
              </div>
            </div>
          )}

          {/* Step: validated */}
          {step === 'validated' && (
            <div className="text-center py-6 space-y-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
                style={{ backgroundColor: '#f0fdf4' }}
              >
                <CheckCircle size={24} style={{ color: '#10b981' }} />
              </div>
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: '#1e2d3d' }}>
                  Proposition validée
                </p>
                <p className="text-xs" style={{ color: '#6b7280' }}>
                  La proposition est prête. Retrouvez-la dans l'onglet Intelligence.
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: '#e8842c' }}
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
