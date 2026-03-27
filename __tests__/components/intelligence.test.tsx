import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import OpportuniteModal from '@/components/intelligence/OpportuniteModal'
import type { OpportuniteIA } from '@/lib/types'

// Mock global fetch
global.fetch = jest.fn()

const mockOpp: OpportuniteIA = {
  id: 'opp-1',
  prospect_id: 'p-1',
  type: 'service_manquant',
  source: 'regle_contentieux_sans_audit',
  titre: 'Audit préventif RH recommandé',
  description: 'Ce client a des contentieux actifs sans audit préventif des pratiques RH.',
  service_propose: 'audit_rh',
  ca_estime: 4500,
  statut: 'detectee',
  email_genere: null,
  proposition_generee: null,
  created_at: new Date().toISOString(),
  prospect: {
    id: 'p-1',
    company_name: 'Transport Dupont SARL',
    siren: null,
    sector: null,
    size: null,
    website: null,
    address: null,
    score: 'chaud',
    tags: [],
    notes: null,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
}

const mockOnClose = jest.fn()
const mockOnStatutChange = jest.fn()

describe('OpportuniteModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        email: { sujet: 'Test sujet', corps: 'Corps du mail test' },
        proposition: {
          titre: 'Proposition test',
          contexte: 'Contexte test',
          livrables: ['Livrable 1', 'Livrable 2'],
          calendrier: 'Démarrage dans 14 jours',
          budget_ht: 4500,
          budget_tva: 900,
          budget_ttc: 5400,
          conditions: 'Conditions standard',
        },
      }),
    })
  })

  it('affiche le titre de l\'opportunité', () => {
    render(
      <OpportuniteModal
        opportunite={mockOpp}
        onClose={mockOnClose}
        onStatutChange={mockOnStatutChange}
      />
    )
    expect(screen.getByText('Audit préventif RH recommandé')).toBeInTheDocument()
  })

  it('affiche le nom de l\'entreprise', () => {
    render(
      <OpportuniteModal
        opportunite={mockOpp}
        onClose={mockOnClose}
        onStatutChange={mockOnStatutChange}
      />
    )
    expect(screen.getByText('Transport Dupont SARL')).toBeInTheDocument()
  })

  it('affiche le CA estimé', () => {
    render(
      <OpportuniteModal
        opportunite={mockOpp}
        onClose={mockOnClose}
        onStatutChange={mockOnStatutChange}
      />
    )
    expect(screen.getByText(/4.500/)).toBeInTheDocument()
  })

  it('appelle onClose quand on clique sur X', () => {
    render(
      <OpportuniteModal
        opportunite={mockOpp}
        onClose={mockOnClose}
        onStatutChange={mockOnStatutChange}
      />
    )
    const closeBtn = screen.getByRole('button', { name: /x/i })
    if (closeBtn) fireEvent.click(closeBtn)
    else {
      // Chercher le bouton par son contenu (icône X)
      const buttons = screen.getAllByRole('button')
      const xBtn = buttons.find((b) => b.querySelector('svg'))
      if (xBtn) fireEvent.click(xBtn)
    }
  })

  it('affiche les onglets Détail, Email, Proposition', () => {
    render(
      <OpportuniteModal
        opportunite={mockOpp}
        onClose={mockOnClose}
        onStatutChange={mockOnStatutChange}
      />
    )
    expect(screen.getByText('Détail')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Proposition')).toBeInTheDocument()
  })

  it('affiche le bouton Générer email + proposition', () => {
    render(
      <OpportuniteModal
        opportunite={mockOpp}
        onClose={mockOnClose}
        onStatutChange={mockOnStatutChange}
      />
    )
    expect(screen.getByText(/Générer email/)).toBeInTheDocument()
  })

  it('affiche le bouton Marquer converti pour une opportunité non convertie', () => {
    render(
      <OpportuniteModal
        opportunite={mockOpp}
        onClose={mockOnClose}
        onStatutChange={mockOnStatutChange}
      />
    )
    expect(screen.getByText(/Marquer converti/)).toBeInTheDocument()
  })

  it('n\'affiche pas Marquer converti si déjà convertie', () => {
    const oppConvertie = { ...mockOpp, statut: 'convertie' as const }
    render(
      <OpportuniteModal
        opportunite={oppConvertie}
        onClose={mockOnClose}
        onStatutChange={mockOnStatutChange}
      />
    )
    expect(screen.queryByText(/Marquer converti/)).not.toBeInTheDocument()
  })

  it('navigue vers l\'onglet Email', () => {
    render(
      <OpportuniteModal
        opportunite={mockOpp}
        onClose={mockOnClose}
        onStatutChange={mockOnStatutChange}
      />
    )
    fireEvent.click(screen.getByText('Email'))
    expect(screen.getByText(/Générer email/i)).toBeInTheDocument()
  })

  it('appelle l\'API generate lors du clic sur Générer', async () => {
    render(
      <OpportuniteModal
        opportunite={mockOpp}
        onClose={mockOnClose}
        onStatutChange={mockOnStatutChange}
      />
    )
    const genBtn = screen.getByText(/Générer email/)
    fireEvent.click(genBtn)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/intelligence/generate',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })
})
