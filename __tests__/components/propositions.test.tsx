/**
 * PropositionsClient tests
 */

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}))

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import PropositionsClient from '@/components/propositions/PropositionsClient'
import type { Proposition, Service } from '@/lib/types'

const mockProspects = [
  { id: 'p1', company_name: 'ACME SAS' },
  { id: 'p2', company_name: 'Beta Corp' },
]

const mockServices: Service[] = []

const mockPropositions: Proposition[] = [
  {
    id: 'prop-1',
    deal_id: null,
    prospect_id: 'p1',
    title: 'Accompagnement contentieux',
    status: 'brouillon',
    total_amount: 5000,
    conditions: null,
    valid_until: '2026-06-01T00:00:00Z',
    sent_at: null,
    opened_at: null,
    answered_at: null,
    created_by: 'user-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    prospect: { id: 'p1', company_name: 'ACME SAS', score: 'chaud', siren: null, sector: null, size: null, website: null, address: null, tags: [], notes: null, created_by: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  },
  {
    id: 'prop-2',
    deal_id: null,
    prospect_id: 'p2',
    title: 'Conseil RGPD',
    status: 'envoyee',
    total_amount: 8000,
    conditions: null,
    valid_until: null,
    sent_at: null,
    opened_at: null,
    answered_at: null,
    created_by: 'user-1',
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
    prospect: { id: 'p2', company_name: 'Beta Corp', score: 'froid', siren: null, sector: null, size: null, website: null, address: null, tags: [], notes: null, created_by: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  },
]

describe('PropositionsClient', () => {
  it('renders proposition list', () => {
    render(<PropositionsClient initialPropositions={mockPropositions} prospects={mockProspects} services={mockServices} />)
    expect(screen.getByText('Accompagnement contentieux')).toBeInTheDocument()
    expect(screen.getByText('Conseil RGPD')).toBeInTheDocument()
  })

  it('shows correct status badges', () => {
    render(<PropositionsClient initialPropositions={mockPropositions} prospects={mockProspects} services={mockServices} />)
    expect(screen.getByText('Brouillon')).toBeInTheDocument()
    expect(screen.getByText('Envoyée')).toBeInTheDocument()
  })

  it('shows correct amounts', () => {
    render(<PropositionsClient initialPropositions={mockPropositions} prospects={mockProspects} services={mockServices} />)
    expect(screen.getByText('5 000 €')).toBeInTheDocument()
    expect(screen.getByText('8 000 €')).toBeInTheDocument()
  })

  it('shows client names', () => {
    render(<PropositionsClient initialPropositions={mockPropositions} prospects={mockProspects} services={mockServices} />)
    expect(screen.getByText('ACME SAS')).toBeInTheDocument()
    expect(screen.getByText('Beta Corp')).toBeInTheDocument()
  })

  it('filters by status', () => {
    render(<PropositionsClient initialPropositions={mockPropositions} prospects={mockProspects} services={mockServices} />)
    const statusSelect = screen.getByDisplayValue('Tous les statuts')
    fireEvent.change(statusSelect, { target: { value: 'brouillon' } })
    expect(screen.getByText('Accompagnement contentieux')).toBeInTheDocument()
    expect(screen.queryByText('Conseil RGPD')).not.toBeInTheDocument()
  })

  it('shows new proposition button', () => {
    render(<PropositionsClient initialPropositions={mockPropositions} prospects={mockProspects} services={mockServices} />)
    expect(screen.getByText('Nouvelle proposition')).toBeInTheDocument()
  })

  it('shows empty state when no propositions', () => {
    render(<PropositionsClient initialPropositions={[]} prospects={mockProspects} services={mockServices} />)
    expect(screen.getByText(/Aucune proposition/i)).toBeInTheDocument()
  })
})
