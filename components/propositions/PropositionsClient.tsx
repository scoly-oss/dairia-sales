'use client'

import { useState } from 'react'
import { Plus, FileText, Download, Eye } from 'lucide-react'
import {
  propositionStatusLabel, propositionStatusClass,
  formatCurrency, formatDate
} from '@/lib/utils'
import type { Proposition, Service } from '@/lib/types'
import PropositionModal from './PropositionModal'
import PropositionPreview from './PropositionPreview'

interface Props {
  initialPropositions: Proposition[]
  prospects: Array<{ id: string; company_name: string }>
  services: Service[]
}

export default function PropositionsClient({ initialPropositions, prospects, services }: Props) {
  const [propositions, setPropositions] = useState(initialPropositions)
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProp, setEditingProp] = useState<Proposition | null>(null)
  const [previewProp, setPreviewProp] = useState<Proposition | null>(null)

  const filtered = propositions.filter((p) => !filterStatus || p.status === filterStatus)

  function handleSaved(prop: Proposition) {
    setPropositions((prev) => {
      const idx = prev.findIndex((p) => p.id === prop.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = prop; return next }
      return [prop, ...prev]
    })
    setShowModal(false)
    setEditingProp(null)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Toolbar */}
      <div
        className="flex items-center gap-3 px-6 py-4 flex-wrap"
        style={{ borderBottom: '1px solid #e5e5e3', backgroundColor: '#ffffff' }}
      >
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-sm px-3 py-2 rounded-lg outline-none"
          style={{ border: '1px solid #e5e5e3', color: '#1e2d3d', backgroundColor: '#f8f8f6' }}
        >
          <option value="">Tous les statuts</option>
          <option value="brouillon">Brouillon</option>
          <option value="envoyee">Envoyée</option>
          <option value="acceptee">Acceptée</option>
          <option value="refusee">Refusée</option>
          <option value="expiree">Expirée</option>
        </select>

        <button
          onClick={() => { setEditingProp(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white ml-auto"
          style={{ backgroundColor: '#e8842c' }}
        >
          <Plus size={15} /> Nouvelle proposition
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e5e3', backgroundColor: '#ffffff' }}>
              {['Titre', 'Client', 'Montant', 'Statut', 'Valide jusqu\'au', 'Créée le', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: '#6b7280' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((prop) => (
              <tr key={prop.id} style={{ borderBottom: '1px solid #f5f5f3' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fafaf8' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText size={16} style={{ color: '#6b7280' }} />
                    <span className="text-sm font-medium" style={{ color: '#1e2d3d' }}>{prop.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm" style={{ color: '#1e2d3d' }}>
                    {(prop as Proposition & { prospect?: { company_name: string } }).prospect?.company_name || '—'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-semibold" style={{ color: '#e8842c' }}>
                    {formatCurrency(prop.total_amount)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${propositionStatusClass(prop.status)}`}>
                    {propositionStatusLabel(prop.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm" style={{ color: '#6b7280' }}>{formatDate(prop.valid_until)}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm" style={{ color: '#6b7280' }}>{formatDate(prop.created_at)}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewProp(prop)}
                      className="p-1.5 rounded-lg" style={{ border: '1px solid #e5e5e3', color: '#6b7280' }}
                      title="Aperçu PDF"
                    >
                      <Eye size={13} />
                    </button>
                    <button
                      onClick={() => { setEditingProp(prop); setShowModal(true) }}
                      className="p-1.5 rounded-lg text-xs" style={{ border: '1px solid #e5e5e3', color: '#6b7280' }}
                    >✏️</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: '#6b7280' }}>
                  Aucune proposition.{' '}
                  <button onClick={() => setShowModal(true)} className="font-medium underline" style={{ color: '#e8842c' }}>
                    Créer la première
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <PropositionModal
          proposition={editingProp}
          prospects={prospects}
          services={services}
          onSave={handleSaved}
          onClose={() => { setShowModal(false); setEditingProp(null) }}
        />
      )}

      {previewProp && (
        <PropositionPreview
          proposition={previewProp}
          onClose={() => setPreviewProp(null)}
        />
      )}
    </div>
  )
}
