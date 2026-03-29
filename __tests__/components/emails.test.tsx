/**
 * EmailsClient tests
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
import EmailsClient from '@/components/emails/EmailsClient'
import type { EmailTemplate, EmailSent, Profile } from '@/lib/types'

const mockCurrentUser: Profile = {
  id: 'user-1',
  email: 'test@dairia.fr',
  name: 'Test User',
  role: 'commercial',
  avatar_url: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const mockProspects = [
  { id: 'p1', company_name: 'ACME SAS' },
]

const mockTemplates: EmailTemplate[] = [
  {
    id: 'tmpl-1',
    name: 'Première prise de contact',
    subject: 'Présentation DAIRIA Avocats',
    body: 'Bonjour, nous vous contactons pour vous présenter nos services juridiques...',
    category: 'prospection',
    created_by: 'user-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
]

const mockSentEmails: EmailSent[] = [
  {
    id: 'email-1',
    prospect_id: 'p1',
    template_id: 'tmpl-1',
    to_email: 'contact@acme.fr',
    subject: 'Présentation DAIRIA',
    body: 'Bonjour...',
    status: 'envoye',
    sent_at: '2026-01-15T10:00:00Z',
    created_by: 'user-1',
  },
]

describe('EmailsClient', () => {
  it('renders tabs', () => {
    render(<EmailsClient initialTemplates={mockTemplates} initialSentEmails={mockSentEmails} prospects={mockProspects} currentUser={mockCurrentUser} />)
    expect(screen.getByText('Templates')).toBeInTheDocument()
    expect(screen.getByText('Historique')).toBeInTheDocument()
    expect(screen.getByText('Nouvel email')).toBeInTheDocument()
  })

  it('shows templates by default', () => {
    render(<EmailsClient initialTemplates={mockTemplates} initialSentEmails={mockSentEmails} prospects={mockProspects} currentUser={mockCurrentUser} />)
    expect(screen.getByText('Première prise de contact')).toBeInTheDocument()
    expect(screen.getByText('Présentation DAIRIA Avocats')).toBeInTheDocument()
  })

  it('shows apply template button', () => {
    render(<EmailsClient initialTemplates={mockTemplates} initialSentEmails={mockSentEmails} prospects={mockProspects} currentUser={mockCurrentUser} />)
    expect(screen.getByText('Utiliser ce template')).toBeInTheDocument()
  })

  it('switches to historique tab', () => {
    render(<EmailsClient initialTemplates={mockTemplates} initialSentEmails={mockSentEmails} prospects={mockProspects} currentUser={mockCurrentUser} />)
    fireEvent.click(screen.getByText('Historique'))
    expect(screen.getByText('Présentation DAIRIA')).toBeInTheDocument()
    expect(screen.getByText('contact@acme.fr')).toBeInTheDocument()
  })

  it('switches to nouvel email tab', () => {
    render(<EmailsClient initialTemplates={mockTemplates} initialSentEmails={mockSentEmails} prospects={mockProspects} currentUser={mockCurrentUser} />)
    fireEvent.click(screen.getByText('Nouvel email'))
    expect(screen.getByPlaceholderText('contact@client.fr')).toBeInTheDocument()
  })

  it('shows empty templates state', () => {
    render(<EmailsClient initialTemplates={[]} initialSentEmails={[]} prospects={mockProspects} currentUser={mockCurrentUser} />)
    expect(screen.getByText('Aucun template.')).toBeInTheDocument()
  })

  it('shows new template button on templates tab', () => {
    render(<EmailsClient initialTemplates={mockTemplates} initialSentEmails={mockSentEmails} prospects={mockProspects} currentUser={mockCurrentUser} />)
    expect(screen.getByText('Nouveau template')).toBeInTheDocument()
  })
})
