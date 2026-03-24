'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Building2, Phone, Mail, ExternalLink } from 'lucide-react'
import { scoreBadgeClass, scoreLabel, formatDate, formatCurrency } from '@/lib/utils'
import type { Prospect } from '@/lib/types'
import ProspectModal from './ProspectModal'

interface ProspectsClientProps {
  initialProspects: Prospect[]
}

export default function ProspectsClient({ initialProspects }: ProspectsClientProps) {
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects)
  const [search, setSearch] = useState('')
  const [filterScore, setFilterScore] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null)

  const filtered = prospects.filter((p) => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      p.company_name.toLowerCase().includes(q) ||
      p.sector?.toLowerCase().includes(q) ||
      p.siren?.includes(q)
    const matchScore = !filterScore || p.score === filterScore
    return matchSearch && matchScore
  })

  function handleSaved(prospect: Prospect) {
    setProspects((prev) => {
      const idx = prev.findIndex((p) => p.id === prospect.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = prospect
        return next
      }
      return [prospect, ...prev]
    })
    setShowModal(false)
    setEditingProspect(null)
  }

  function handleDelete(id: string) {
    setProspects((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Toolbar */}
      <div
        className="flex items-center gap-3 px-6 py-4 flex-wrap"
        style={{ borderBottom: '1px solid #e5e5e3', backgroundColor: '#ffffff' }}
      >
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6b7280' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par entreprise, secteur, SIREN..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none"
            style={{ border: '1px solid #e5e5e3', color: '#1e2d3d', backgroundColor: '#f8f8f6' }}
          />
        </div>

        <select
          value={filterScore}
          onChange={(e) => setFilterScore(e.target.value)}
          className="text-sm px-3 py-2 rounded-lg outline-none"
          style={{ border: '1px solid #e5e5e3', color: '#1e2d3d', backgroundColor: '#f8f8f6' }}
        >
          <option value="">Tous les scores</option>
          <option value="chaud">🔴 Chaud</option>
          <option value="tiede">🟠 Tiède</option>
          <option value="froid">🔵 Froid</option>
        </select>

        <button
          onClick={() => { setEditingProspect(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white ml-auto"
          style={{ backgroundColor: '#e8842c' }}
        >
          <Plus size={15} />
          Nouveau prospect
        </button>
      </div>

      {/* Stats bar */}
      <div
        className="flex items-center gap-6 px-6 py-2 text-sm"
        style={{ backgroundColor: '#f8f8f6', borderBottom: '1px solid #e5e5e3' }}
      >
        <span style={{ color: '#6b7280' }}>
          <strong style={{ color: '#1e2d3d' }}>{filtered.length}</strong> prospect{filtered.length !== 1 ? 's' : ''}
        </span>
        {['chaud', 'tiede', 'froid'].map((s) => (
          <span key={s} style={{ color: '#6b7280' }}>
            <strong style={{ color: '#1e2d3d' }}>
              {filtered.filter((p) => p.score === s).length}
            </strong>{' '}
            {s}
          </span>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e5e3', backgroundColor: '#ffffff' }}>
              {['Entreprise', 'Contact principal', 'Secteur', 'Score', 'Deals', 'Créé le', ''].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: '#6b7280' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((prospect) => {
              const primary = prospect.contacts?.find((c) => c.is_primary) || prospect.contacts?.[0]
              const activeDeals = prospect.deals?.filter((d) => d.stage !== 'perdu') || []
              const dealValue = activeDeals.reduce((s, d) => s + d.amount, 0)
              return (
                <tr
                  key={prospect.id}
                  className="transition-colors"
                  style={{ borderBottom: '1px solid #f5f5f3' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fafaf8' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: '#f0f7ff' }}
                      >
                        <Building2 size={14} style={{ color: '#1e2d3d' }} />
                      </div>
                      <div>
                        <Link
                          href={`/prospects/${prospect.id}`}
                          className="text-sm font-medium hover:underline"
                          style={{ color: '#1e2d3d' }}
                        >
                          {prospect.company_name}
                        </Link>
                        {prospect.siren && (
                          <p className="text-xs" style={{ color: '#6b7280' }}>SIREN: {prospect.siren}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {primary ? (
                      <div>
                        <p className="text-sm" style={{ color: '#1e2d3d' }}>{primary.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {primary.email && (
                            <a href={`mailto:${primary.email}`} className="text-xs flex items-center gap-1" style={{ color: '#6b7280' }}>
                              <Mail size={10} /> {primary.email}
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm" style={{ color: '#6b7280' }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm" style={{ color: '#6b7280' }}>
                      {prospect.sector || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${scoreBadgeClass(prospect.score)}`}>
                      {scoreLabel(prospect.score)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {activeDeals.length > 0 ? (
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#1e2d3d' }}>
                          {activeDeals.length} deal{activeDeals.length > 1 ? 's' : ''}
                        </p>
                        <p className="text-xs" style={{ color: '#e8842c' }}>
                          {formatCurrency(dealValue)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm" style={{ color: '#6b7280' }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm" style={{ color: '#6b7280' }}>
                      {formatDate(prospect.created_at)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/prospects/${prospect.id}`}
                        className="p-1.5 rounded-lg text-xs font-medium"
                        style={{ border: '1px solid #e5e5e3', color: '#6b7280' }}
                      >
                        <ExternalLink size={13} />
                      </Link>
                      <button
                        onClick={() => { setEditingProspect(prospect); setShowModal(true) }}
                        className="p-1.5 rounded-lg text-xs font-medium"
                        style={{ border: '1px solid #e5e5e3', color: '#6b7280' }}
                      >
                        ✏️
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: '#6b7280' }}>
                  Aucun prospect trouvé.{' '}
                  <button
                    onClick={() => setShowModal(true)}
                    className="font-medium underline"
                    style={{ color: '#e8842c' }}
                  >
                    Créer le premier prospect
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <ProspectModal
          prospect={editingProspect}
          onSave={handleSaved}
          onClose={() => { setShowModal(false); setEditingProspect(null) }}
        />
      )}
    </div>
  )
}
