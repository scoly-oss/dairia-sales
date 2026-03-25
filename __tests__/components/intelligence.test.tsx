import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import OpportuniteModal from '@/components/intelligence/OpportuniteModal'
import type { OpportuniteIA } from '@/lib/types'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
  usePathname: () => '/intelligence',
}))

// Mock lucide-react
jest.mock('lucide-react', () => {
  const MockIcon = ({ size }: { size?: number }) => <span data-testid="icon" style={{ fontSize: size }} />
  return new Proxy(
    {},
    {
      get: () => MockIcon,
    }
  )
})

const mockOpportunite: OpportuniteIA = {
  id: 'opp-1',
  prospect_id: 'prospect-1',
  type: 'service_manquant',
  source: 'Absence de conformité RGPD',
  titre: 'Audit RGPD recommandé',
  description: 'La société ne respecte pas le RGPD.',
  service_propose: 'conformite',
  ca_estime: 3500,
  statut: 'nouvelle',
  email_genere: 'Objet: Audit RGPD\n\nBonjour,\n\nNous vous contactons...',
  proposition_generee: 'PROPOSITION COMMERCIALE\n\nDate: 01/01/2026\n\nClient: Société Test',
  created_at: new Date().toISOString(),
}

describe('OpportuniteModal', () => {
  it('renders the opportunity title', () => {
    render(
      <OpportuniteModal opportunite={mockOpportunite} onClose={() => {}} />
    )
    expect(screen.getByText('Audit RGPD recommandé')).toBeInTheDocument()
  })

  it('shows email tab by default', () => {
    render(
      <OpportuniteModal opportunite={mockOpportunite} onClose={() => {}} />
    )
    expect(screen.getByText(/Email personnalisé/)).toBeInTheDocument()
  })

  it('shows email content by default', () => {
    render(
      <OpportuniteModal opportunite={mockOpportunite} onClose={() => {}} />
    )
    expect(screen.getByText(/Nous vous contactons/)).toBeInTheDocument()
  })

  it('switches to proposition tab when clicked', () => {
    render(
      <OpportuniteModal opportunite={mockOpportunite} onClose={() => {}} />
    )
    const propTab = screen.getByText(/Proposition commerciale/)
    fireEvent.click(propTab)
    expect(screen.getByText(/PROPOSITION COMMERCIALE/)).toBeInTheDocument()
  })

  it('calls onClose when X button clicked', () => {
    const onClose = jest.fn()
    render(
      <OpportuniteModal opportunite={mockOpportunite} onClose={onClose} />
    )
    // Find the Fermer button
    const fermerBtn = screen.getByText('Fermer')
    fireEvent.click(fermerBtn)
    expect(onClose).toHaveBeenCalled()
  })

  it('shows warning about validating before sending', () => {
    render(
      <OpportuniteModal opportunite={mockOpportunite} onClose={() => {}} />
    )
    expect(screen.getByText(/Vérifiez et adaptez avant envoi/)).toBeInTheDocument()
  })

  it('shows "Email non généré." when email_genere is null', () => {
    const oppNoEmail: OpportuniteIA = {
      ...mockOpportunite,
      email_genere: null,
      proposition_generee: null,
    }
    render(
      <OpportuniteModal opportunite={oppNoEmail} onClose={() => {}} />
    )
    expect(screen.getByText('Email non généré.')).toBeInTheDocument()
  })

  it('shows "Proposition non générée." on proposition tab when null', () => {
    const oppNoContent: OpportuniteIA = {
      ...mockOpportunite,
      email_genere: null,
      proposition_generee: null,
    }
    render(
      <OpportuniteModal opportunite={oppNoContent} onClose={() => {}} />
    )
    const propTab = screen.getByText(/Proposition commerciale/)
    fireEvent.click(propTab)
    expect(screen.getByText('Proposition non générée.')).toBeInTheDocument()
  })

  it('shows Copy button', () => {
    render(
      <OpportuniteModal opportunite={mockOpportunite} onClose={() => {}} />
    )
    expect(screen.getByText('Copier')).toBeInTheDocument()
  })
})
