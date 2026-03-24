/**
 * CatalogueClient tests
 */

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}))

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import CatalogueClient from '@/components/catalogue/CatalogueClient'
import type { Service } from '@/lib/types'

const mockServices: Service[] = [
  {
    id: 's1',
    name: 'Consultation initiale',
    category: 'conseil',
    description: 'Première consultation',
    unit_price: 250,
    hourly_rate: null,
    is_hourly: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 's2',
    name: 'Audit RGPD',
    category: 'conformite',
    description: 'Audit complet',
    unit_price: 3500,
    hourly_rate: null,
    is_hourly: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 's3',
    name: 'Conseil contentieux',
    category: 'contentieux',
    description: null,
    unit_price: null,
    hourly_rate: 350,
    is_hourly: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
]

describe('CatalogueClient', () => {
  it('renders service names', () => {
    render(<CatalogueClient initialServices={mockServices} />)
    expect(screen.getByText('Consultation initiale')).toBeInTheDocument()
    expect(screen.getByText('Audit RGPD')).toBeInTheDocument()
    expect(screen.getByText('Conseil contentieux')).toBeInTheDocument()
  })

  it('renders category sections', () => {
    render(<CatalogueClient initialServices={mockServices} />)
    expect(screen.getByText('Conseil')).toBeInTheDocument()
    expect(screen.getByText('Conformité')).toBeInTheDocument()
    expect(screen.getByText('Contentieux')).toBeInTheDocument()
  })

  it('shows new service button', () => {
    render(<CatalogueClient initialServices={mockServices} />)
    expect(screen.getByText('Nouvelle prestation')).toBeInTheDocument()
  })

  it('filters by category', () => {
    render(<CatalogueClient initialServices={mockServices} />)
    const select = screen.getByDisplayValue('Toutes les catégories')
    fireEvent.change(select, { target: { value: 'conseil' } })
    expect(screen.getByText('Consultation initiale')).toBeInTheDocument()
  })

  it('renders empty state', () => {
    render(<CatalogueClient initialServices={[]} />)
    // No services — no content sections
    expect(screen.queryByText('Consultation initiale')).not.toBeInTheDocument()
  })
})
