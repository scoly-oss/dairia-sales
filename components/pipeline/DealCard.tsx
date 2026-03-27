'use client'

import { Draggable } from '@hello-pangea/dnd'
import { MoreVertical, Pencil, Trash2, Building2, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { formatCurrency, formatDate, scoreBadgeClass, sourceLabel } from '@/lib/utils'
import type { Deal, IaProposal } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import ProposalGenerator from '@/components/intelligence/ProposalGenerator'

interface DealCardProps {
  deal: Deal
  index: number
  onEdit: (deal: Deal) => void
  onDelete: (id: string) => void
}

export default function DealCard({ deal, index, onEdit, onDelete }: DealCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showAI, setShowAI] = useState(false)

  async function handleDelete() {
    if (!confirm('Supprimer ce deal ?')) return
    const supabase = createClient()
    await supabase.from('deals').delete().eq('id', deal.id)
    onDelete(deal.id)
    setMenuOpen(false)
  }

  const prospect = (deal as Deal & { prospect?: { company_name: string; score: string } }).prospect

  return (
    <>
    <Draggable draggableId={deal.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="rounded-xl p-3.5 relative"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e5e3',
            boxShadow: snapshot.isDragging
              ? '0 8px 24px rgba(0,0,0,0.12)'
              : '0 1px 3px rgba(0,0,0,0.04)',
            transform: snapshot.isDragging ? 'rotate(1.5deg)' : 'none',
            transition: snapshot.isDragging ? 'none' : 'box-shadow 0.15s ease',
            cursor: 'grab',
          }}
        >
          {/* Title + menu */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-sm font-semibold leading-tight" style={{ color: '#1e2d3d' }}>
              {deal.title}
            </p>
            <div className="relative flex-shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
                className="p-1 rounded-lg"
                style={{ color: '#6b7280' }}
              >
                <MoreVertical size={14} />
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div
                    className="absolute right-0 top-6 z-20 rounded-xl py-1 shadow-lg min-w-[140px]"
                    style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e3' }}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(deal); setMenuOpen(false) }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left"
                      style={{ color: '#1e2d3d' }}
                    >
                      <Pencil size={13} /> Modifier
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowAI(true); setMenuOpen(false) }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left"
                      style={{ color: '#e8842c' }}
                    >
                      <Sparkles size={13} /> Générer proposition IA
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete() }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left"
                      style={{ color: '#ef4444' }}
                    >
                      <Trash2 size={13} /> Supprimer
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Company */}
          {prospect && (
            <div className="flex items-center gap-1.5 mb-2">
              <Building2 size={12} style={{ color: '#6b7280' }} />
              <span className="text-xs" style={{ color: '#6b7280' }}>
                {prospect.company_name}
              </span>
              {prospect.score && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-medium ml-auto ${scoreBadgeClass(prospect.score as 'chaud' | 'tiede' | 'froid')}`}
                >
                  {prospect.score === 'chaud' ? '🔴' : prospect.score === 'tiede' ? '🟠' : '🔵'}
                </span>
              )}
            </div>
          )}

          {/* Amount */}
          <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid #f0f0ee' }}>
            <span className="text-sm font-bold" style={{ color: '#e8842c' }}>
              {formatCurrency(deal.amount)}
            </span>
            <span className="text-xs" style={{ color: '#6b7280' }}>
              {deal.probability}%
            </span>
          </div>

          {/* Source + date */}
          <div className="flex items-center justify-between mt-1.5">
            {deal.source && (
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{ backgroundColor: '#f8f8f6', color: '#6b7280' }}
              >
                {sourceLabel(deal.source)}
              </span>
            )}
            <span className="text-xs ml-auto" style={{ color: '#6b7280' }}>
              {formatDate(deal.created_at)}
            </span>
          </div>
        </div>
      )}
    </Draggable>
    {showAI && (
      <ProposalGenerator
        deal={deal}
        onClose={() => setShowAI(false)}
        onValidated={(_proposal: IaProposal) => setShowAI(false)}
      />
    )}
  </>
  )
}
