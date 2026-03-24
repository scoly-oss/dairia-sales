/**
 * ProspectsClient tests
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
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-id' } } }),
    },
  })),
}))

jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>
  }
})

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ProspectsClient from '@/components/prospects/ProspectsClient'
import type { Prospect } from '@/lib/types'

const mockProspects: Prospect[] = [
  {
    id: 'p1',
    company_name: 'ACME SAS',
    siren: '123456789',
    sector: 'Tech',
    size: 'PME',
    website: 'https://acme.fr',
    address: null,
    score: 'chaud',
    tags: ['tech', 'urgent'],
    notes: null,
    created_by: null,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
    contacts: [{ id: 'c1', prospect_id: 'p1', name: 'Jean Dupont', email: 'jean@acme.fr', phone: '0600000000', function: 'DG', is_primary: true, created_at: '2024-01-01T00:00:00Z' }],
    deals: [{ id: 'd1', prospect_id: 'p1', title: 'Deal', amount: 5000, stage: 'prospect', probability: 10, source: null, assigned_to: null, notes: null, closed_at: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }],
  },
  {
    id: 'p2',
    company_name: 'Beta Corp',
    siren: null,
    sector: 'Finance',
    size: 'ETI',
    website: null,
    address: null,
    score: 'froid',
    tags: [],
    notes: null,
    created_by: null,
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-02-01T10:00:00Z',
    contacts: [],
    deals: [],
  },
]

describe('ProspectsClient', () => {
  it('renders prospect list', () => {
    render(<ProspectsClient initialProspects={mockProspects} />)
    expect(screen.getByText('ACME SAS')).toBeInTheDocument()
    expect(screen.getByText('Beta Corp')).toBeInTheDocument()
  })

  it('shows correct count in stats', () => {
    render(<ProspectsClient initialProspects={mockProspects} />)
    expect(screen.getByText(/2/)).toBeInTheDocument()
  })

  it('filters by search query', () => {
    render(<ProspectsClient initialProspects={mockProspects} />)
    const searchInput = screen.getByPlaceholderText(/Rechercher/i)
    fireEvent.change(searchInput, { target: { value: 'ACME' } })
    expect(screen.getByText('ACME SAS')).toBeInTheDocument()
    expect(screen.queryByText('Beta Corp')).not.toBeInTheDocument()
  })

  it('filters by sector', () => {
    render(<ProspectsClient initialProspects={mockProspects} />)
    const searchInput = screen.getByPlaceholderText(/Rechercher/i)
    fireEvent.change(searchInput, { target: { value: 'Finance' } })
    expect(screen.getByText('Beta Corp')).toBeInTheDocument()
    expect(screen.queryByText('ACME SAS')).not.toBeInTheDocument()
  })

  it('filters by score', () => {
    render(<ProspectsClient initialProspects={mockProspects} />)
    const scoreSelect = screen.getByDisplayValue('Tous les scores')
    fireEvent.change(scoreSelect, { target: { value: 'chaud' } })
    expect(screen.getByText('ACME SAS')).toBeInTheDocument()
    expect(screen.queryByText('Beta Corp')).not.toBeInTheDocument()
  })

  it('shows new prospect button', () => {
    render(<ProspectsClient initialProspects={mockProspects} />)
    expect(screen.getByText('Nouveau prospect')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    render(<ProspectsClient initialProspects={[]} />)
    expect(screen.getByText(/Aucun prospect/i)).toBeInTheDocument()
  })

  it('shows deal info for prospects with deals', () => {
    render(<ProspectsClient initialProspects={mockProspects} />)
    expect(screen.getByText(/1 deal/)).toBeInTheDocument()
  })

  it('shows primary contact info', () => {
    render(<ProspectsClient initialProspects={mockProspects} />)
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
  })
})
