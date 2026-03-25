'use client'

import React, { useState } from 'react'
import { X, Mail, FileText, Copy, CheckCircle } from 'lucide-react'
import type { OpportuniteIA } from '@/lib/types'

interface OpportuniteModalProps {
  opportunite: OpportuniteIA
  onClose: () => void
}

export default function OpportuniteModal({ opportunite, onClose }: OpportuniteModalProps) {
  const [tab, setTab] = useState<'email' | 'proposition'>('email')
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    const content = tab === 'email' ? opportunite.email_genere : opportunite.proposition_generee
    if (!content) return
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl"
        style={{ backgroundColor: '#ffffff' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid #e5e5e3' }}
        >
          <div>
            <h2 className="font-semibold text-base" style={{ color: '#1e2d3d' }}>
              {opportunite.titre}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
              Généré par l'IA — À valider avant envoi
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg"
            style={{ border: '1px solid #e5e5e3', color: '#6b7280' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-5 pt-3 gap-1" style={{ borderBottom: '1px solid #e5e5e3' }}>
          {([
            { id: 'email', label: 'Email personnalisé', icon: Mail },
            { id: 'proposition', label: 'Proposition commerciale', icon: FileText },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg transition-all"
              style={{
                color: tab === id ? '#e8842c' : '#6b7280',
                borderBottom: tab === id ? '2px solid #e8842c' : '2px solid transparent',
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <div
            className="rounded-xl p-4 font-mono text-sm whitespace-pre-wrap leading-relaxed"
            style={{
              backgroundColor: '#f8f8f6',
              color: '#1e2d3d',
              border: '1px solid #e5e5e3',
              minHeight: '300px',
            }}
          >
            {tab === 'email'
              ? opportunite.email_genere || 'Email non généré.'
              : opportunite.proposition_generee || 'Proposition non générée.'}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderTop: '1px solid #e5e5e3' }}
        >
          <p className="text-xs" style={{ color: '#6b7280' }}>
            ⚠️ Ceci est un brouillon généré automatiquement. Vérifiez et adaptez avant envoi.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-medium"
              style={{ border: '1px solid #e5e5e3', color: '#1e2d3d' }}
            >
              {copied ? <CheckCircle size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
              {copied ? 'Copié !' : 'Copier'}
            </button>
            <button
              onClick={onClose}
              className="text-sm px-4 py-2 rounded-lg font-semibold text-white"
              style={{ backgroundColor: '#e8842c' }}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
