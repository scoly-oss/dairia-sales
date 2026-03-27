// Tests for lib/claude.ts — testing the parsing and prompt building logic
// The actual Anthropic API call is mocked

const mockCreate = jest.fn()

jest.mock('@anthropic-ai/sdk', () => ({
  default: jest.fn(() => ({
    messages: {
      create: mockCreate,
    },
  })),
}))

import { generateProposal } from '@/lib/claude'
import type { ClientProfile } from '@/lib/claude'

const baseProfile: ClientProfile = {
  prospect: {
    id: 'p1',
    company_name: 'Acme Corp',
    sector: 'Technologie',
    size: '50-200 salariés',
    score: 'chaud',
    tags: ['SaaS', 'croissance'],
    notes: 'Prospect très intéressé',
    siren: null,
    website: null,
    address: null,
    created_by: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  deal: {
    id: 'd1',
    prospect_id: 'p1',
    title: 'Conformité RGPD',
    amount: 15000,
    stage: 'qualification',
    probability: 25,
    source: 'linkedin',
    assigned_to: null,
    notes: null,
    closed_at: null,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  interactions: [
    {
      id: 'i1',
      prospect_id: 'p1',
      type: 'email',
      notes: 'Premier contact positif',
      date: '2024-01-10T00:00:00Z',
      created_by: null,
      created_at: '2024-01-10T00:00:00Z',
    },
  ],
  contacts: [
    {
      id: 'c1',
      prospect_id: 'p1',
      name: 'Jean Dupont',
      email: 'jean@acme.com',
      phone: null,
      function: 'DG',
      is_primary: true,
      created_at: '2024-01-01T00:00:00Z',
    },
  ],
}

const validApiResponse = {
  email_subject: 'Votre conformité RGPD : agissez avant juin',
  email_body: 'Bonjour Jean,\n\nVotre entreprise est exposée...\n\nCordialement,\nDAIRIA Avocats',
  key_arguments: [
    'Risque CNIL de 4% du CA mondial',
    'Obligation légale depuis 2018',
    'Audit gratuit en première approche',
  ],
  urgency_reason: 'Contrôles CNIL en hausse de 30% en 2024',
  risk_if_no_action: 'Amende pouvant atteindre 600 000 € pour votre taille',
}

function setupApiResponse(responseText: string) {
  mockCreate.mockResolvedValueOnce({
    content: [{ type: 'text', text: responseText }],
  })
}

describe('generateProposal', () => {
  const originalEnv = process.env.ANTHROPIC_API_KEY

  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key-123'
    jest.clearAllMocks()
  })

  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = originalEnv
  })

  it('throws if ANTHROPIC_API_KEY is not set', async () => {
    delete process.env.ANTHROPIC_API_KEY
    await expect(generateProposal(baseProfile)).rejects.toThrow('ANTHROPIC_API_KEY non configurée')
  })

  it('returns parsed proposal for valid JSON response', async () => {
    setupApiResponse(JSON.stringify(validApiResponse))
    const result = await generateProposal(baseProfile)

    expect(result.email_subject).toBe(validApiResponse.email_subject)
    expect(result.email_body).toBe(validApiResponse.email_body)
    expect(result.key_arguments).toHaveLength(3)
    expect(result.urgency_reason).toBe(validApiResponse.urgency_reason)
    expect(result.risk_if_no_action).toBe(validApiResponse.risk_if_no_action)
  })

  it('strips markdown code blocks from response', async () => {
    const wrapped = '```json\n' + JSON.stringify(validApiResponse) + '\n```'
    setupApiResponse(wrapped)
    const result = await generateProposal(baseProfile)
    expect(result.email_subject).toBe(validApiResponse.email_subject)
  })

  it('throws on invalid JSON response', async () => {
    setupApiResponse("Ce n'est pas du JSON valide")
    await expect(generateProposal(baseProfile)).rejects.toThrow('Impossible de parser la réponse Claude')
  })

  it('throws on response missing required fields', async () => {
    setupApiResponse(JSON.stringify({ email_subject: 'Objet seulement' }))
    await expect(generateProposal(baseProfile)).rejects.toThrow('Format de réponse Claude invalide')
  })

  it('calls the API with claude-sonnet-4-6 model', async () => {
    setupApiResponse(JSON.stringify(validApiResponse))
    await generateProposal(baseProfile)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'claude-sonnet-4-6' })
    )
  })

  it('sends user message with prospect company name in prompt', async () => {
    setupApiResponse(JSON.stringify(validApiResponse))
    await generateProposal(baseProfile)

    const call = mockCreate.mock.calls[0][0] as { messages: Array<{ content: string }> }
    const prompt = call.messages[0].content
    expect(prompt).toContain('Acme Corp')
    expect(prompt).toContain('Technologie')
  })

  it('handles profile with no interactions', async () => {
    setupApiResponse(JSON.stringify(validApiResponse))
    const profileNoInteractions: ClientProfile = { ...baseProfile, interactions: [] }
    const result = await generateProposal(profileNoInteractions)
    expect(result.email_subject).toBeDefined()
  })

  it('handles profile with no contacts', async () => {
    setupApiResponse(JSON.stringify(validApiResponse))
    const profileNoContacts: ClientProfile = { ...baseProfile, contacts: [] }
    const result = await generateProposal(profileNoContacts)
    expect(result.email_subject).toBeDefined()
  })

  it('handles prospect with null optional fields', async () => {
    setupApiResponse(JSON.stringify(validApiResponse))
    const profileNulls: ClientProfile = {
      ...baseProfile,
      prospect: {
        ...baseProfile.prospect,
        sector: null,
        size: null,
        notes: null,
        tags: [],
      },
    }
    const result = await generateProposal(profileNulls)
    expect(result.email_subject).toBeDefined()
  })

  it('defaults urgency_reason and risk_if_no_action to empty string if missing', async () => {
    const minimalResponse = {
      email_subject: 'Objet',
      email_body: 'Corps',
      key_arguments: ['arg1'],
    }
    setupApiResponse(JSON.stringify(minimalResponse))
    const result = await generateProposal(baseProfile)
    expect(result.urgency_reason).toBe('')
    expect(result.risk_if_no_action).toBe('')
  })

  it('throws on unexpected content type from API', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'image', source: { type: 'base64', data: '' } }],
    })
    await expect(generateProposal(baseProfile)).rejects.toThrow('Type de réponse Claude inattendu')
  })

  it('uses primary contact in prompt when available', async () => {
    setupApiResponse(JSON.stringify(validApiResponse))
    await generateProposal(baseProfile)

    const call = mockCreate.mock.calls[0][0] as { messages: Array<{ content: string }> }
    const prompt = call.messages[0].content
    expect(prompt).toContain('Jean Dupont')
  })
})
