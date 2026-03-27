import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import IntelligenceClient from '@/components/intelligence/IntelligenceClient'
import type { IaProposal } from '@/lib/types'

const mockProposal: IaProposal = {
  id: 'prop-1',
  deal_id: 'deal-1',
  prospect_id: 'prospect-1',
  email_subject: 'Votre conformité RGPD urgente',
  email_body: 'Bonjour,\n\nVotre entreprise est exposée à des risques...\n\nCordialement,\nDAIRIA Avocats',
  key_arguments: ['Risque amende CNIL', 'Obligation légale', 'Audit gratuit'],
  urgency_reason: 'Contrôles CNIL en hausse',
  risk_if_no_action: 'Amende jusqu\'à 4% du CA',
  status: 'draft',
  modified_email_subject: null,
  modified_email_body: null,
  created_by: 'user-1',
  validated_by: null,
  validated_at: null,
  sent_at: null,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  prospect: { id: 'prospect-1', company_name: 'Acme Corp' } as IaProposal['prospect'],
  deal: { id: 'deal-1', title: 'Conformité RGPD' } as IaProposal['deal'],
}

const validatedProposal: IaProposal = {
  ...mockProposal,
  id: 'prop-2',
  email_subject: 'Audit ATMP — protégez vos salariés',
  status: 'validated',
  validated_by: 'user-1',
  validated_at: '2024-01-16T10:00:00Z',
}

const sentProposal: IaProposal = {
  ...mockProposal,
  id: 'prop-3',
  email_subject: 'Proposition contentieux commercial',
  status: 'sent',
  sent_at: '2024-01-17T10:00:00Z',
}

describe('IntelligenceClient', () => {
  it('renders empty state when no proposals', () => {
    render(<IntelligenceClient initialProposals={[]} />)
    expect(screen.getByText('Aucune proposition IA')).toBeInTheDocument()
    expect(screen.getByText(/Générez des propositions depuis le pipeline/)).toBeInTheDocument()
  })

  it('renders proposal list with correct count', () => {
    render(<IntelligenceClient initialProposals={[mockProposal, validatedProposal, sentProposal]} />)
    expect(screen.getByText('Votre conformité RGPD urgente')).toBeInTheDocument()
    expect(screen.getByText('Audit ATMP — protégez vos salariés')).toBeInTheDocument()
    expect(screen.getByText('Proposition contentieux commercial')).toBeInTheDocument()
  })

  it('shows correct stats counts', () => {
    render(<IntelligenceClient initialProposals={[mockProposal, validatedProposal, sentProposal]} />)
    // Total = 3
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1)
    // Draft = 1
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1)
  })

  it('shows status badges for proposals', () => {
    render(<IntelligenceClient initialProposals={[mockProposal, validatedProposal]} />)
    expect(screen.getByText('Brouillon')).toBeInTheDocument()
    expect(screen.getByText('Validée')).toBeInTheDocument()
  })

  it('shows prospect and deal info in proposal row', () => {
    render(<IntelligenceClient initialProposals={[mockProposal]} />)
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText(/Conformité RGPD/)).toBeInTheDocument()
  })

  it('expands proposal on click to show key arguments', async () => {
    render(<IntelligenceClient initialProposals={[mockProposal]} />)
    const row = screen.getByText('Votre conformité RGPD urgente').closest('button')
    fireEvent.click(row!)

    await waitFor(() => {
      expect(screen.getByText('Risque amende CNIL')).toBeInTheDocument()
      expect(screen.getByText('Obligation légale')).toBeInTheDocument()
      expect(screen.getByText('Audit gratuit')).toBeInTheDocument()
    })
  })

  it('shows urgency and risk sections when expanded', async () => {
    render(<IntelligenceClient initialProposals={[mockProposal]} />)
    const row = screen.getByText('Votre conformité RGPD urgente').closest('button')
    fireEvent.click(row!)

    await waitFor(() => {
      expect(screen.getByText('Contrôles CNIL en hausse')).toBeInTheDocument()
      expect(screen.getByText(/Amende jusqu'à 4%/)).toBeInTheDocument()
    })
  })

  it('shows email body when expanded', async () => {
    render(<IntelligenceClient initialProposals={[mockProposal]} />)
    const row = screen.getByText('Votre conformité RGPD urgente').closest('button')
    fireEvent.click(row!)

    await waitFor(() => {
      expect(screen.getByText(/Votre entreprise est exposée/)).toBeInTheDocument()
    })
  })

  it('collapses proposal on second click', async () => {
    render(<IntelligenceClient initialProposals={[mockProposal]} />)
    const row = screen.getByText('Votre conformité RGPD urgente').closest('button')

    fireEvent.click(row!)
    await waitFor(() => {
      expect(screen.getByText('Risque amende CNIL')).toBeInTheDocument()
    })

    fireEvent.click(row!)
    await waitFor(() => {
      expect(screen.queryByText('Risque amende CNIL')).not.toBeInTheDocument()
    })
  })

  it('filters proposals by status', async () => {
    render(<IntelligenceClient initialProposals={[mockProposal, validatedProposal, sentProposal]} />)

    // Click on "Validées" filter
    const filterButtons = screen.getAllByRole('button')
    const validatedFilter = filterButtons.find((btn) => btn.textContent?.includes('Validées'))
    fireEvent.click(validatedFilter!)

    await waitFor(() => {
      expect(screen.getByText('Audit ATMP — protégez vos salariés')).toBeInTheDocument()
      expect(screen.queryByText('Votre conformité RGPD urgente')).not.toBeInTheDocument()
      expect(screen.queryByText('Proposition contentieux commercial')).not.toBeInTheDocument()
    })
  })

  it('shows modified email label when proposal was modified', async () => {
    const modifiedProposal: IaProposal = {
      ...mockProposal,
      modified_email_body: 'Corps modifié par l\'avocat',
    }
    render(<IntelligenceClient initialProposals={[modifiedProposal]} />)
    const row = screen.getByText('Votre conformité RGPD urgente').closest('button')
    fireEvent.click(row!)

    await waitFor(() => {
      expect(screen.getByText(/modifié/)).toBeInTheDocument()
      expect(screen.getByText('Corps modifié par l\'avocat')).toBeInTheDocument()
    })
  })

  it('resets to all proposals when All filter is clicked', async () => {
    render(<IntelligenceClient initialProposals={[mockProposal, validatedProposal]} />)

    // Filter to validated
    const filterButtons = screen.getAllByRole('button')
    const validatedFilter = filterButtons.find((btn) => btn.textContent?.includes('Validées'))
    fireEvent.click(validatedFilter!)

    await waitFor(() => {
      expect(screen.queryByText('Votre conformité RGPD urgente')).not.toBeInTheDocument()
    })

    // Click Total filter to reset
    const totalFilter = filterButtons.find((btn) => btn.textContent?.includes('Total'))
    fireEvent.click(totalFilter!)

    await waitFor(() => {
      expect(screen.getByText('Votre conformité RGPD urgente')).toBeInTheDocument()
      expect(screen.getByText('Audit ATMP — protégez vos salariés')).toBeInTheDocument()
    })
  })
})
