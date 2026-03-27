import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import OpportuniteModal from '@/components/intelligence/OpportuniteModal'
import type { OpportuniteIA } from '@/lib/types'

const mockOpportunite: OpportuniteIA & { prospect?: { company_name: string } } = {
  id: 'opp-test-1',
  prospect_id: 'prospect-1',
  type: 'service_manquant',
  source: 'regle:contentieux_sans_audit',
  titre: 'Audit RH préventif recommandé',
  description: 'Client avec contentieux sans audit RH. Un audit préventif est recommandé.',
  service_propose: 'audit_rh',
  ca_estime: 4500,
  statut: 'nouvelle',
  email_genere: null,
  proposition_generee: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  prospect: { company_name: 'Transports Dupont SA' },
}

const mockOnClose = jest.fn()
const mockOnStatutChange = jest.fn()

describe('OpportuniteModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('affiche le titre de l\'opportunité', () => {
    render(
      <OpportuniteModal
        opportunite={mockOpportunite}
        onClose={mockOnClose}
        onStatutChange={mockOnStatutChange}
      />
    )
    expect(screen.getByText('Audit RH préventif recommandé')).toBeInTheDocument()
  })

  it('affiche le nom du client', () => {
    render(
      <OpportuniteModal
        opportunite={mockOpportunite}
        onClose={mockOnClose}
        onStatutChange={mockOnStatutChange}
      />
    )
    expect(screen.getByText('Transports Dupont SA')).toBeInTheDocument()
  })

  it('affiche le CA estimé', () => {
    render(
      <OpportuniteModal
        opportunite={mockOpportunite}
        onClose={mockOnClose}
        onStatutChange={mockOnStatutChange}
      />
    )
    expect(screen.getByText(/4\s*500/)).toBeInTheDocument()
  })

  it('appelle onClose quand le bouton Fermer est cliqué', () => {
    render(
      <OpportuniteModal
        opportunite={mockOpportunite}
        onClose={mockOnClose}
        onStatutChange={mockOnStatutChange}
      />
    )
    fireEvent.click(screen.getByText('Fermer'))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('affiche les 3 onglets', () => {
    render(
      <OpportuniteModal
        opportunite={mockOpportunite}
        onClose={mockOnClose}
        onStatutChange={mockOnStatutChange}
      />
    )
    expect(screen.getByText('Détails')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Proposition')).toBeInTheDocument()
  })

  it('navigue vers l\'onglet Email', () => {
    render(
      <OpportuniteModal
        opportunite={mockOpportunite}
        onClose={mockOnClose}
        onStatutChange={mockOnStatutChange}
      />
    )
    fireEvent.click(screen.getByText('Email'))
    expect(screen.getByText(/Générer l/)).toBeInTheDocument()
  })

  it('navigue vers l\'onglet Proposition', () => {
    render(
      <OpportuniteModal
        opportunite={mockOpportunite}
        onClose={mockOnClose}
        onStatutChange={mockOnStatutChange}
      />
    )
    fireEvent.click(screen.getByText('Proposition'))
    expect(screen.getByText(/Générer la proposition/)).toBeInTheDocument()
  })

  it('affiche le statut actuel', () => {
    render(
      <OpportuniteModal
        opportunite={mockOpportunite}
        onClose={mockOnClose}
        onStatutChange={mockOnStatutChange}
      />
    )
    expect(screen.getByText('Nouvelle')).toBeInTheDocument()
  })

  it('affiche la description de l\'opportunité', () => {
    render(
      <OpportuniteModal
        opportunite={mockOpportunite}
        onClose={mockOnClose}
        onStatutChange={mockOnStatutChange}
      />
    )
    expect(screen.getByText(/contentieux sans audit/)).toBeInTheDocument()
  })
})
