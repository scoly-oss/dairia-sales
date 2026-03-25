import { generateEmail, generateProposition } from '@/lib/intelligence/generator'
import type { OpportuniteIA, Prospect, ClientIntelligence } from '@/lib/types'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockProspect: Prospect = {
  id: 'prospect-1',
  company_name: 'SOCIÉTÉ TEST SAS',
  siren: '123456789',
  sector: 'Transport',
  size: '50-250',
  score: 'chaud',
  tags: [],
  notes: null,
  website: null,
  address: null,
  created_by: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const mockClient: ClientIntelligence = {
  id: 'intel-1',
  prospect_id: 'prospect-1',
  secteur: 'Transport routier',
  code_naf: '4941A',
  idcc: '16',
  effectif_tranche: 'de_50_250',
  services_souscrits: ['contentieux'],
  score_opportunite: 72,
  updated_at: new Date().toISOString(),
}

const baseOpportunite: OpportuniteIA = {
  id: 'opp-1',
  prospect_id: 'prospect-1',
  type: 'service_manquant',
  source: 'Absence de mise en conformité RGPD',
  titre: 'Audit RGPD — obligation légale',
  description: 'La société TEST SAS ne bénéficie pas encore d\'un accompagnement RGPD.',
  service_propose: 'conformite',
  ca_estime: 3500,
  statut: 'nouvelle',
  email_genere: null,
  proposition_generee: null,
  created_at: new Date().toISOString(),
}

// ---------------------------------------------------------------------------
// generateEmail
// ---------------------------------------------------------------------------

describe('generateEmail', () => {
  it('includes the company name', () => {
    const email = generateEmail(baseOpportunite, mockProspect, mockClient)
    expect(email).toContain('SOCIÉTÉ TEST SAS')
  })

  it('includes the opportunity title', () => {
    const email = generateEmail(baseOpportunite, mockProspect, mockClient)
    expect(email).toContain(baseOpportunite.titre)
  })

  it('includes the service label', () => {
    const email = generateEmail(baseOpportunite, mockProspect, mockClient)
    expect(email).toContain('Conformité')
  })

  it('includes urgence context for service_manquant type', () => {
    const email = generateEmail(baseOpportunite, mockProspect, mockClient)
    expect(email).toContain('exposition')
  })

  it('includes urgence context for actu_juridique type', () => {
    const opp: OpportuniteIA = { ...baseOpportunite, type: 'actu_juridique', source: 'Actu juridique: Décret 2026-001' }
    const email = generateEmail(opp, mockProspect, mockClient)
    expect(email).toContain('évolution juridique')
  })

  it('includes urgence context for saisonnalite type', () => {
    const opp: OpportuniteIA = { ...baseOpportunite, type: 'saisonnalite' }
    const email = generateEmail(opp, mockProspect, mockClient)
    expect(email).toContain('période')
  })

  it('includes secteur in email body', () => {
    const email = generateEmail(baseOpportunite, mockProspect, mockClient)
    expect(email).toContain('Transport routier')
  })

  it('generates non-empty email', () => {
    const email = generateEmail(baseOpportunite, mockProspect, mockClient)
    expect(email.length).toBeGreaterThan(200)
  })

  it('includes DAIRIA signature', () => {
    const email = generateEmail(baseOpportunite, mockProspect, mockClient)
    expect(email).toContain('DAIRIA')
  })

  it('generates different emails for different services', () => {
    const oppAudit: OpportuniteIA = { ...baseOpportunite, service_propose: 'audit' }
    const oppFormation: OpportuniteIA = { ...baseOpportunite, service_propose: 'formation' }
    const emailAudit = generateEmail(oppAudit, mockProspect, mockClient)
    const emailFormation = generateEmail(oppFormation, mockProspect, mockClient)
    expect(emailAudit).not.toBe(emailFormation)
  })

  it('handles all service types without throwing', () => {
    const services = ['contentieux', 'conseil', 'conformite', 'formation', 'audit', 'autre']
    services.forEach((service) => {
      expect(() =>
        generateEmail({ ...baseOpportunite, service_propose: service }, mockProspect, mockClient)
      ).not.toThrow()
    })
  })
})

// ---------------------------------------------------------------------------
// generateProposition
// ---------------------------------------------------------------------------

describe('generateProposition', () => {
  it('includes the company name', () => {
    const prop = generateProposition(baseOpportunite, mockProspect, mockClient)
    expect(prop).toContain('SOCIÉTÉ TEST SAS')
  })

  it('includes the opportunity title', () => {
    const prop = generateProposition(baseOpportunite, mockProspect, mockClient)
    expect(prop).toContain(baseOpportunite.titre)
  })

  it('includes SIREN', () => {
    const prop = generateProposition(baseOpportunite, mockProspect, mockClient)
    expect(prop).toContain('123456789')
  })

  it('includes IDCC', () => {
    const prop = generateProposition(baseOpportunite, mockProspect, mockClient)
    expect(prop).toContain('IDCC 16')
  })

  it('includes code NAF', () => {
    const prop = generateProposition(baseOpportunite, mockProspect, mockClient)
    expect(prop).toContain('4941A')
  })

  it('includes a validity date', () => {
    const prop = generateProposition(baseOpportunite, mockProspect, mockClient)
    expect(prop).toContain('VALIDITÉ')
  })

  it('includes the budget section', () => {
    const prop = generateProposition(baseOpportunite, mockProspect, mockClient)
    expect(prop).toContain('3 500')
  })

  it('includes TVA calculation', () => {
    const prop = generateProposition(baseOpportunite, mockProspect, mockClient)
    expect(prop).toContain('700') // 20% of 3500
  })

  it('generates hourly billing for contentieux', () => {
    const opp: OpportuniteIA = { ...baseOpportunite, service_propose: 'contentieux', ca_estime: 5000 }
    const prop = generateProposition(opp, mockProspect, mockClient)
    expect(prop).toContain('heure')
  })

  it('generates flat fee for conformite', () => {
    const prop = generateProposition(baseOpportunite, mockProspect, mockClient)
    expect(prop).toContain('Forfait')
  })

  it('generates non-empty proposition', () => {
    const prop = generateProposition(baseOpportunite, mockProspect, mockClient)
    expect(prop.length).toBeGreaterThan(500)
  })

  it('includes deliverables for all service types', () => {
    const services = ['audit', 'conformite', 'formation', 'conseil', 'contentieux']
    services.forEach((service) => {
      const prop = generateProposition(
        { ...baseOpportunite, service_propose: service },
        mockProspect,
        mockClient
      )
      expect(prop).toContain('•')
    })
  })

  it('handles all service types without throwing', () => {
    const services = ['contentieux', 'conseil', 'conformite', 'formation', 'audit', 'autre']
    services.forEach((service) => {
      expect(() =>
        generateProposition(
          { ...baseOpportunite, service_propose: service },
          mockProspect,
          mockClient
        )
      ).not.toThrow()
    })
  })

  it('includes DAIRIA branding', () => {
    const prop = generateProposition(baseOpportunite, mockProspect, mockClient)
    expect(prop).toContain('DAIRIA')
  })
})
