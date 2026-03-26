/**
 * VeilleClient tests
 */

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null, data: null }),
      single: jest.fn().mockResolvedValue({ data: { id: 'new-prospect-id' }, error: null }),
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
import VeilleClient from '@/components/veille/VeilleClient'
import VeilleWidget from '@/components/dashboard/VeilleWidget'
import type { VeilleAlerte, VeilleConcurrent } from '@/lib/types'

const mockAlertes: VeilleAlerte[] = [
  {
    id: 'a1',
    type: 'concurrentielle',
    categorie: 'cabinet',
    titre: 'Capstan ouvre un bureau à Lyon',
    resume: 'Détail sur l\'ouverture du bureau Capstan.',
    source_url: 'https://example.com',
    sentiment: 'negatif',
    importance: 'haute',
    prospect_id: null,
    lu: false,
    archive: false,
    created_at: '2026-03-10T10:00:00Z',
  },
  {
    id: 'a2',
    type: 'marche',
    categorie: 'opportunite',
    titre: 'PSE chez Acme Corp — 200 salariés',
    resume: 'Plan de sauvegarde de l\'emploi détecté.',
    source_url: null,
    sentiment: 'neutre',
    importance: 'haute',
    prospect_id: null,
    lu: false,
    archive: false,
    created_at: '2026-03-11T10:00:00Z',
  },
  {
    id: 'a3',
    type: 'reputation',
    categorie: 'mention',
    titre: 'Mention positive DAIRIA sur LinkedIn',
    resume: 'Un DRH recommande DAIRIA Avocats.',
    source_url: 'https://linkedin.com/post/123',
    sentiment: 'positif',
    importance: 'normale',
    prospect_id: null,
    lu: true,
    archive: false,
    created_at: '2026-03-12T10:00:00Z',
  },
]

const mockConcurrents: VeilleConcurrent[] = [
  {
    id: 'c1',
    nom: 'Capstan Avocats',
    type: 'cabinet',
    secteur: 'Droit social',
    site_web: 'https://www.capstan.fr',
    notes: 'Cabinet national leader.',
    forces: ['Notoriété nationale', 'Réseau grands comptes'],
    faiblesses: ['Tarifs élevés', 'Moins agile'],
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'c2',
    nom: 'Doctrine',
    type: 'legaltech',
    secteur: 'Recherche juridique IA',
    site_web: 'https://www.doctrine.fr',
    notes: 'Legaltech leader.',
    forces: ['Leader marché', 'Base jurisprudence'],
    faiblesses: ['Pas de CRM', 'Prix élevé'],
    created_at: '2026-01-01T00:00:00Z',
  },
]

describe('VeilleClient', () => {
  it('renders alert list', () => {
    render(
      <VeilleClient
        initialAlertes={mockAlertes}
        initialConcurrents={mockConcurrents}
        initialConfig={null}
      />
    )
    expect(screen.getByText('Capstan ouvre un bureau à Lyon')).toBeInTheDocument()
    expect(screen.getByText('PSE chez Acme Corp — 200 salariés')).toBeInTheDocument()
    expect(screen.getByText('Mention positive DAIRIA sur LinkedIn')).toBeInTheDocument()
  })

  it('shows unread badge count', () => {
    render(
      <VeilleClient
        initialAlertes={mockAlertes}
        initialConcurrents={mockConcurrents}
        initialConfig={null}
      />
    )
    // 2 non lues (a1 et a2)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('filters by type concurrentielle', () => {
    render(
      <VeilleClient
        initialAlertes={mockAlertes}
        initialConcurrents={mockConcurrents}
        initialConfig={null}
      />
    )
    const typeSelect = screen.getByDisplayValue('Tous les types')
    fireEvent.change(typeSelect, { target: { value: 'concurrentielle' } })
    expect(screen.getByText('Capstan ouvre un bureau à Lyon')).toBeInTheDocument()
    expect(screen.queryByText('PSE chez Acme Corp — 200 salariés')).not.toBeInTheDocument()
    expect(screen.queryByText('Mention positive DAIRIA sur LinkedIn')).not.toBeInTheDocument()
  })

  it('filters by type marche', () => {
    render(
      <VeilleClient
        initialAlertes={mockAlertes}
        initialConcurrents={mockConcurrents}
        initialConfig={null}
      />
    )
    const typeSelect = screen.getByDisplayValue('Tous les types')
    fireEvent.change(typeSelect, { target: { value: 'marche' } })
    expect(screen.queryByText('Capstan ouvre un bureau à Lyon')).not.toBeInTheDocument()
    expect(screen.getByText('PSE chez Acme Corp — 200 salariés')).toBeInTheDocument()
  })

  it('filters by importance haute', () => {
    render(
      <VeilleClient
        initialAlertes={mockAlertes}
        initialConcurrents={mockConcurrents}
        initialConfig={null}
      />
    )
    const importanceSelect = screen.getByDisplayValue('Toutes importances')
    fireEvent.change(importanceSelect, { target: { value: 'haute' } })
    expect(screen.getByText('Capstan ouvre un bureau à Lyon')).toBeInTheDocument()
    expect(screen.getByText('PSE chez Acme Corp — 200 salariés')).toBeInTheDocument()
    expect(screen.queryByText('Mention positive DAIRIA sur LinkedIn')).not.toBeInTheDocument()
  })

  it('filters non lues', () => {
    render(
      <VeilleClient
        initialAlertes={mockAlertes}
        initialConcurrents={mockConcurrents}
        initialConfig={null}
      />
    )
    const luSelect = screen.getByDisplayValue('Toutes')
    fireEvent.change(luSelect, { target: { value: 'non_lu' } })
    expect(screen.getByText('Capstan ouvre un bureau à Lyon')).toBeInTheDocument()
    expect(screen.getByText('PSE chez Acme Corp — 200 salariés')).toBeInTheDocument()
    expect(screen.queryByText('Mention positive DAIRIA sur LinkedIn')).not.toBeInTheDocument()
  })

  it('filters lues', () => {
    render(
      <VeilleClient
        initialAlertes={mockAlertes}
        initialConcurrents={mockConcurrents}
        initialConfig={null}
      />
    )
    const luSelect = screen.getByDisplayValue('Toutes')
    fireEvent.change(luSelect, { target: { value: 'lu' } })
    expect(screen.queryByText('Capstan ouvre un bureau à Lyon')).not.toBeInTheDocument()
    expect(screen.getByText('Mention positive DAIRIA sur LinkedIn')).toBeInTheDocument()
  })

  it('shows empty state when no alerts', () => {
    render(
      <VeilleClient
        initialAlertes={[]}
        initialConcurrents={mockConcurrents}
        initialConfig={null}
      />
    )
    expect(screen.getByText(/Aucune alerte de veille/i)).toBeInTheDocument()
  })

  it('shows "Creer prospect" button for marche alerts', () => {
    render(
      <VeilleClient
        initialAlertes={mockAlertes}
        initialConcurrents={mockConcurrents}
        initialConfig={null}
      />
    )
    expect(screen.getByText('Prospect')).toBeInTheDocument()
  })

  it('does not show "Creer prospect" for non-marche alerts', () => {
    render(
      <VeilleClient
        initialAlertes={[mockAlertes[0]]} // concurrentielle only
        initialConcurrents={mockConcurrents}
        initialConfig={null}
      />
    )
    expect(screen.queryByText('Prospect')).not.toBeInTheDocument()
  })

  it('switches to concurrents tab', () => {
    render(
      <VeilleClient
        initialAlertes={mockAlertes}
        initialConcurrents={mockConcurrents}
        initialConfig={null}
      />
    )
    const concurrentsTab = screen.getByRole('button', { name: /Concurrents/ })
    fireEvent.click(concurrentsTab)
    expect(screen.getByText('Capstan Avocats')).toBeInTheDocument()
    expect(screen.getByText('Doctrine')).toBeInTheDocument()
  })

  it('shows concurrent details on card click', () => {
    render(
      <VeilleClient
        initialAlertes={mockAlertes}
        initialConcurrents={mockConcurrents}
        initialConfig={null}
      />
    )
    const concurrentsTab = screen.getByRole('button', { name: /Concurrents/ })
    fireEvent.click(concurrentsTab)
    const capstanCard = screen.getByText('Capstan Avocats').closest('div')
    if (capstanCard) fireEvent.click(capstanCard)
    // Modal should show notes
    expect(screen.getByText('Cabinet national leader.')).toBeInTheDocument()
  })

  it('shows forces and faiblesses in concurrent modal', () => {
    render(
      <VeilleClient
        initialAlertes={mockAlertes}
        initialConcurrents={mockConcurrents}
        initialConfig={null}
      />
    )
    const concurrentsTab = screen.getByRole('button', { name: /Concurrents/ })
    fireEvent.click(concurrentsTab)
    const capstanCard = screen.getByText('Capstan Avocats').closest('div')
    if (capstanCard) fireEvent.click(capstanCard)
    expect(screen.getByText('Notoriété nationale')).toBeInTheDocument()
    expect(screen.getByText('Tarifs élevés')).toBeInTheDocument()
  })

  it('shows alert detail modal on card click', () => {
    render(
      <VeilleClient
        initialAlertes={mockAlertes}
        initialConcurrents={mockConcurrents}
        initialConfig={null}
      />
    )
    const alertCard = screen.getByText('Capstan ouvre un bureau à Lyon')
    fireEvent.click(alertCard)
    expect(screen.getByText('Détail sur l\'ouverture du bureau Capstan.')).toBeInTheDocument()
  })

  it('shows stat buttons for each type', () => {
    render(
      <VeilleClient
        initialAlertes={mockAlertes}
        initialConcurrents={mockConcurrents}
        initialConfig={null}
      />
    )
    expect(screen.getByText('Concurrentielle')).toBeInTheDocument()
    expect(screen.getByText('Marché')).toBeInTheDocument()
    expect(screen.getByText('Réputation')).toBeInTheDocument()
  })
})

describe('VeilleWidget', () => {
  it('renders recent alertes', () => {
    render(<VeilleWidget alertes={mockAlertes} nonLuCount={2} />)
    expect(screen.getByText('Capstan ouvre un bureau à Lyon')).toBeInTheDocument()
    expect(screen.getByText('PSE chez Acme Corp — 200 salariés')).toBeInTheDocument()
  })

  it('shows non-lu count badge', () => {
    render(<VeilleWidget alertes={mockAlertes} nonLuCount={2} />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('shows "Voir tout" link to /veille', () => {
    render(<VeilleWidget alertes={mockAlertes} nonLuCount={2} />)
    expect(screen.getByText(/Voir tout/i).closest('a')).toHaveAttribute('href', '/veille')
  })

  it('shows empty state when no alertes', () => {
    render(<VeilleWidget alertes={[]} nonLuCount={0} />)
    expect(screen.getByText(/Aucune alerte récente/i)).toBeInTheDocument()
  })

  it('does not show badge when no non-lu', () => {
    render(<VeilleWidget alertes={mockAlertes} nonLuCount={0} />)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('shows veille widget title', () => {
    render(<VeilleWidget alertes={mockAlertes} nonLuCount={2} />)
    expect(screen.getByText('Veille Stratégique')).toBeInTheDocument()
  })
})
