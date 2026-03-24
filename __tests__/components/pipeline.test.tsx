/**
 * Pipeline Kanban tests
 */

jest.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Droppable: ({ children }: { children: (provided: object, snapshot: object) => React.ReactNode }) =>
    children({ innerRef: () => {}, droppableProps: {}, placeholder: null }, { isDraggingOver: false }),
  Draggable: ({ children }: { children: (provided: object, snapshot: object) => React.ReactNode }) =>
    children(
      { innerRef: () => {}, draggableProps: {}, dragHandleProps: {} },
      { isDragging: false }
    ),
}))

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
      delete: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
    })),
  })),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import KanbanBoard from '@/components/pipeline/KanbanBoard'
import type { Deal } from '@/lib/types'

const mockProfiles = [
  { id: 'user-1', name: 'Alice Martin', email: 'alice@example.com' },
]

const mockDeals: Deal[] = [
  {
    id: 'deal-1',
    prospect_id: 'prospect-1',
    title: 'Deal Contentieux A',
    amount: 15000,
    stage: 'qualification',
    probability: 25,
    source: 'referral',
    assigned_to: 'user-1',
    notes: null,
    closed_at: null,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'deal-2',
    prospect_id: 'prospect-2',
    title: 'Deal RGPD B',
    amount: 8000,
    stage: 'proposition',
    probability: 50,
    source: 'linkedin',
    assigned_to: null,
    notes: null,
    closed_at: null,
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z',
  },
  {
    id: 'deal-3',
    prospect_id: 'prospect-3',
    title: 'Deal Gagné C',
    amount: 25000,
    stage: 'gagne',
    probability: 100,
    source: 'website',
    assigned_to: 'user-1',
    notes: null,
    closed_at: '2024-02-01T10:00:00Z',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-02-01T10:00:00Z',
  },
]

describe('KanbanBoard', () => {
  it('renders all pipeline stages', () => {
    render(<KanbanBoard initialDeals={mockDeals} profiles={mockProfiles} />)
    expect(screen.getByText('Prospect')).toBeInTheDocument()
    expect(screen.getByText('Qualification')).toBeInTheDocument()
    expect(screen.getByText('Proposition')).toBeInTheDocument()
    expect(screen.getByText('Négociation')).toBeInTheDocument()
    expect(screen.getByText('Gagné')).toBeInTheDocument()
    expect(screen.getByText('Perdu')).toBeInTheDocument()
  })

  it('renders deal titles', () => {
    render(<KanbanBoard initialDeals={mockDeals} profiles={mockProfiles} />)
    expect(screen.getByText('Deal Contentieux A')).toBeInTheDocument()
    expect(screen.getByText('Deal RGPD B')).toBeInTheDocument()
    expect(screen.getByText('Deal Gagné C')).toBeInTheDocument()
  })

  it('shows filter selects', () => {
    render(<KanbanBoard initialDeals={mockDeals} profiles={mockProfiles} />)
    expect(screen.getByText('Toutes les sources')).toBeInTheDocument()
    expect(screen.getByText('Tous les commerciaux')).toBeInTheDocument()
  })

  it('shows new deal button', () => {
    render(<KanbanBoard initialDeals={mockDeals} profiles={mockProfiles} />)
    expect(screen.getByText('Nouveau deal')).toBeInTheDocument()
  })

  it('renders with empty deals', () => {
    render(<KanbanBoard initialDeals={[]} profiles={mockProfiles} />)
    expect(screen.getByText('Prospect')).toBeInTheDocument()
  })
})
