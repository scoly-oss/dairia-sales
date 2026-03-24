/**
 * RelancesClient tests
 */

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-id' } } }),
    },
  })),
}))

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import RelancesClient from '@/components/relances/RelancesClient'
import type { Task, Profile } from '@/lib/types'

const mockCurrentUser: Profile = {
  id: 'user-1',
  email: 'user@example.com',
  name: 'Test User',
  role: 'commercial',
  avatar_url: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const today = new Date().toISOString().split('T')[0]
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

const mockTasks: Task[] = [
  {
    id: 't1',
    prospect_id: 'p1',
    deal_id: null,
    title: 'Relance email ACME',
    description: 'Envoyer un email de relance',
    due_date: today,
    status: 'a_faire',
    priority: 'haute',
    assigned_to: 'user-1',
    created_by: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 't2',
    prospect_id: null,
    deal_id: null,
    title: 'Tâche en retard',
    description: null,
    due_date: yesterday,
    status: 'a_faire',
    priority: 'normale',
    assigned_to: null,
    created_by: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 't3',
    prospect_id: null,
    deal_id: null,
    title: 'Tâche future',
    description: null,
    due_date: tomorrow,
    status: 'a_faire',
    priority: 'faible',
    assigned_to: null,
    created_by: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 't4',
    prospect_id: null,
    deal_id: null,
    title: 'Tâche terminée',
    description: null,
    due_date: yesterday,
    status: 'fait',
    priority: 'normale',
    assigned_to: null,
    created_by: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
]

describe('RelancesClient', () => {
  const defaultProps = {
    initialTasks: mockTasks,
    prospects: [{ id: 'p1', company_name: 'ACME SAS' }],
    profiles: [{ id: 'user-1', name: 'Test User', email: 'user@example.com' }],
    currentUser: mockCurrentUser,
  }

  it('renders task sections', () => {
    render(<RelancesClient {...defaultProps} />)
    expect(screen.getByText(/En retard/)).toBeInTheDocument()
    expect(screen.getByText(/Aujourd'hui/)).toBeInTheDocument()
    expect(screen.getByText(/À venir/)).toBeInTheDocument()
  })

  it('renders task titles', () => {
    render(<RelancesClient {...defaultProps} />)
    expect(screen.getByText('Relance email ACME')).toBeInTheDocument()
    expect(screen.getByText('Tâche en retard')).toBeInTheDocument()
    expect(screen.getByText('Tâche future')).toBeInTheDocument()
  })

  it('shows new task button', () => {
    render(<RelancesClient {...defaultProps} />)
    expect(screen.getByText('Nouvelle tâche')).toBeInTheDocument()
  })

  it('renders empty state with no tasks', () => {
    render(<RelancesClient {...defaultProps} initialTasks={[]} />)
    expect(screen.getByText(/Aucune tâche/i)).toBeInTheDocument()
  })

  it('filters by status', () => {
    render(<RelancesClient {...defaultProps} />)
    const statusSelect = screen.getByDisplayValue('Tous les statuts')
    fireEvent.change(statusSelect, { target: { value: 'fait' } })
    expect(screen.getByText('Tâche terminée')).toBeInTheDocument()
  })
})
