'use client'

import { useState, useCallback } from 'react'
import { DragDropContext, DropResult } from '@hello-pangea/dnd'
import KanbanColumn from './KanbanColumn'
import DealModal from './DealModal'
import { createClient } from '@/lib/supabase/client'
import { stageLabel, stageColor, formatCurrency } from '@/lib/utils'
import type { Deal, DealStage } from '@/lib/types'
import { Plus, Filter } from 'lucide-react'

const STAGES: DealStage[] = [
  'prospect', 'qualification', 'proposition', 'negociation', 'gagne', 'perdu'
]

interface KanbanBoardProps {
  initialDeals: Deal[]
  profiles: Array<{ id: string; name: string | null; email: string }>
}

export default function KanbanBoard({ initialDeals, profiles }: KanbanBoardProps) {
  const [deals, setDeals] = useState<Deal[]>(initialDeals)
  const [filterSource, setFilterSource] = useState('')
  const [filterAssignee, setFilterAssignee] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)

  const filteredDeals = deals.filter((d) => {
    if (filterSource && d.source !== filterSource) return false
    if (filterAssignee && d.assigned_to !== filterAssignee) return false
    return true
  })

  const dealsByStage = STAGES.reduce<Record<DealStage, Deal[]>>((acc, stage) => {
    acc[stage] = filteredDeals.filter((d) => d.stage === stage)
    return acc
  }, {} as Record<DealStage, Deal[]>)

  const onDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination || source.droppableId === destination.droppableId) return

    const newStage = destination.droppableId as DealStage
    setDeals((prev) =>
      prev.map((d) => (d.id === draggableId ? { ...d, stage: newStage } : d))
    )

    const supabase = createClient()
    await supabase
      .from('deals')
      .update({ stage: newStage, updated_at: new Date().toISOString() })
      .eq('id', draggableId)
  }, [])

  function handleDealSaved(deal: Deal) {
    setDeals((prev) => {
      const idx = prev.findIndex((d) => d.id === deal.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = deal
        return next
      }
      return [deal, ...prev]
    })
    setShowModal(false)
    setEditingDeal(null)
  }

  function handleDeleteDeal(id: string) {
    setDeals((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Toolbar */}
      <div
        className="flex items-center gap-3 px-6 py-3 flex-wrap"
        style={{ borderBottom: '1px solid #e5e5e3', backgroundColor: '#ffffff' }}
      >
        <Filter size={15} style={{ color: '#6b7280' }} />
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className="text-sm px-3 py-1.5 rounded-lg outline-none"
          style={{ border: '1px solid #e5e5e3', color: '#1e2d3d', backgroundColor: '#f8f8f6' }}
        >
          <option value="">Toutes les sources</option>
          <option value="referral">Recommandation</option>
          <option value="website">Site web</option>
          <option value="linkedin">LinkedIn</option>
          <option value="cold_call">Prospection</option>
          <option value="event">Événement</option>
          <option value="autre">Autre</option>
        </select>

        <select
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
          className="text-sm px-3 py-1.5 rounded-lg outline-none"
          style={{ border: '1px solid #e5e5e3', color: '#1e2d3d', backgroundColor: '#f8f8f6' }}
        >
          <option value="">Tous les commerciaux</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name || p.email}
            </option>
          ))}
        </select>

        <div className="ml-auto">
          <button
            onClick={() => { setEditingDeal(null); setShowModal(true) }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: '#e8842c' }}
          >
            <Plus size={15} />
            Nouveau deal
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 h-full" style={{ minWidth: `${STAGES.length * 280 + (STAGES.length - 1) * 16}px` }}>
            {STAGES.map((stage) => {
              const stageDeals = dealsByStage[stage]
              const total = stageDeals.reduce((s, d) => s + d.amount, 0)
              return (
                <KanbanColumn
                  key={stage}
                  stage={stage}
                  deals={stageDeals}
                  count={stageDeals.length}
                  total={total}
                  onEditDeal={(deal) => { setEditingDeal(deal); setShowModal(true) }}
                  onDeleteDeal={handleDeleteDeal}
                />
              )
            })}
          </div>
        </DragDropContext>
      </div>

      {showModal && (
        <DealModal
          deal={editingDeal}
          profiles={profiles}
          onSave={handleDealSaved}
          onClose={() => { setShowModal(false); setEditingDeal(null) }}
        />
      )}
    </div>
  )
}
