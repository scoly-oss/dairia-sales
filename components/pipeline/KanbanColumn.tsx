'use client'

import { Droppable } from '@hello-pangea/dnd'
import DealCard from './DealCard'
import { stageLabel, stageColor, formatCurrency } from '@/lib/utils'
import type { Deal, DealStage } from '@/lib/types'

interface KanbanColumnProps {
  stage: DealStage
  deals: Deal[]
  count: number
  total: number
  onEditDeal: (deal: Deal) => void
  onDeleteDeal: (id: string) => void
}

export default function KanbanColumn({
  stage,
  deals,
  count,
  total,
  onEditDeal,
  onDeleteDeal,
}: KanbanColumnProps) {
  const color = stageColor(stage)

  return (
    <div
      className="flex flex-col rounded-[14px]"
      style={{
        width: '280px',
        minWidth: '280px',
        backgroundColor: '#f8f8f6',
        border: '1px solid #e5e5e3',
      }}
    >
      {/* Column header */}
      <div
        className="px-4 py-3 rounded-t-[14px]"
        style={{ borderBottom: '2px solid ' + color }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: '#1e2d3d' }}>
              {stageLabel(stage)}
            </span>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: color }}
            >
              {count}
            </span>
          </div>
        </div>
        <div className="text-xs mt-1" style={{ color: '#6b7280' }}>
          {formatCurrency(total)}
        </div>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={stage}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex-1 p-3 space-y-2 overflow-y-auto"
            style={{
              minHeight: '200px',
              maxHeight: 'calc(100vh - 280px)',
              backgroundColor: snapshot.isDraggingOver
                ? `${color}10`
                : 'transparent',
              transition: 'background-color 0.15s ease',
            }}
          >
            {deals.map((deal, index) => (
              <DealCard
                key={deal.id}
                deal={deal}
                index={index}
                onEdit={onEditDeal}
                onDelete={onDeleteDeal}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
