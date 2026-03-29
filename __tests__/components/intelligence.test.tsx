import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import OpportuniteModal from '@/components/intelligence/OpportuniteModal'
import type { OpportuniteIA } from '@/lib/types'

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
})

function makeOpp(overrides: Partial<OpportuniteIA> = {}): OpportuniteIA {
  return {
    id: 'opp-test',
    client_intelligence_id: 'ci-test',
    organisation_id: null,
    organisation_nom: 'Cabinet Test',
    type: 'services_manquants',
    source: 'rule_contentieux_audit',
    titre: 'Audit préventif RH — Cabinet Test',
    description: 'Description de l\'opportunité test.',
    service_propose: 'audit_rh',
    ca_estime: 3500,
    statut: 'nouvelle',
    actu_id: null,
    email_genere: null,
    proposition_generee: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

describe('OpportuniteModal', () => {
  it('affiche le titre de l\'opportunité', () => {
    render(<OpportuniteModal opportunite={makeOpp()} onClose={jest.fn()} />)
    expect(screen.getByText('Audit préventif RH — Cabinet Test')).toBeInTheDocument()
  })

  it('affiche le nom de l\'organisation', () => {
    render(<OpportuniteModal opportunite={makeOpp()} onClose={jest.fn()} />)
    expect(screen.getByText('Cabinet Test')).toBeInTheDocument()
  })

  it('affiche le CA estimé', () => {
    render(<OpportuniteModal opportunite={makeOpp()} onClose={jest.fn()} />)
    expect(screen.getByText(/3.*500/)).toBeInTheDocument()
  })

  it('affiche le badge de type', () => {
    render(<OpportuniteModal opportunite={makeOpp()} onClose={jest.fn()} />)
    expect(screen.getByText('Service manquant')).toBeInTheDocument()
  })

  it('affiche le badge de statut', () => {
    render(<OpportuniteModal opportunite={makeOpp({ statut: 'nouvelle' })} onClose={jest.fn()} />)
    expect(screen.getByText('Nouvelle')).toBeInTheDocument()
  })

  it('appelle onClose au clic sur Fermer', () => {
    const onClose = jest.fn()
    render(<OpportuniteModal opportunite={makeOpp()} onClose={onClose} />)
    fireEvent.click(screen.getByText('Fermer'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('navigue vers l\'onglet Email au clic', () => {
    render(<OpportuniteModal opportunite={makeOpp()} onClose={jest.fn()} />)
    fireEvent.click(screen.getByText('Email'))
    expect(screen.getByText('Email non encore généré')).toBeInTheDocument()
  })

  it('navigue vers l\'onglet Proposition au clic', () => {
    render(<OpportuniteModal opportunite={makeOpp()} onClose={jest.fn()} />)
    fireEvent.click(screen.getByText('Proposition'))
    expect(screen.getByText('Proposition non encore générée')).toBeInTheDocument()
  })

  it('affiche l\'email généré si disponible', () => {
    const opp = makeOpp({ email_genere: 'Objet: Test\n\nContenu email test' })
    render(<OpportuniteModal opportunite={opp} onClose={jest.fn()} />)
    fireEvent.click(screen.getByText('Email'))
    expect(screen.getByText(/Contenu email test/)).toBeInTheDocument()
  })

  it('affiche la proposition générée si disponible', () => {
    const opp = makeOpp({ proposition_generee: '**Proposition commerciale**\n\nBudget HT : 3 500 €' })
    render(<OpportuniteModal opportunite={opp} onClose={jest.fn()} />)
    fireEvent.click(screen.getByText('Proposition'))
    expect(screen.getByText(/Budget HT/)).toBeInTheDocument()
  })

  it('affiche le service proposé', () => {
    render(<OpportuniteModal opportunite={makeOpp({ service_propose: 'audit_rh' })} onClose={jest.fn()} />)
    expect(screen.getByText('Audit des pratiques RH')).toBeInTheDocument()
  })
})
