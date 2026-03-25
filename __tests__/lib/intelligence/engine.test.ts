import {
  SERVICE_GAP_RULES,
  SEASONAL_RULES,
  detectOpportunites,
  calculateScore,
  EFFECTIF_LABELS,
  OPPORTUNITE_TYPE_LABELS,
  OPPORTUNITE_STATUT_LABELS,
  ACTU_SOURCE_LABELS,
  SERVICE_LABELS,
  ALL_SERVICES,
  opportuniteStatutColor,
  opportuniteStatutBg,
  opportuniteTypeIcon,
} from '@/lib/intelligence/engine'
import type { ClientIntelligence, Prospect, ActuImpact, OpportuniteIA } from '@/lib/types'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockProspect: Prospect = {
  id: 'prospect-1',
  company_name: 'TEST COMPANY SAS',
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

const baseClient: ClientIntelligence = {
  id: 'intel-1',
  prospect_id: 'prospect-1',
  secteur: 'Transport routier',
  code_naf: '4941A',
  idcc: '16',
  effectif_tranche: 'de_50_250',
  services_souscrits: [],
  score_opportunite: 0,
  updated_at: new Date().toISOString(),
}

const mockActu: ActuImpact = {
  id: 'actu-1',
  source_type: 'decret',
  source_ref: 'Décret 2026-001',
  titre: 'Test décret',
  resume: 'Un décret test impactant les transports.',
  clients_concernes_ids: ['prospect-1'],
  services_concernes: ['formation'],
  created_at: new Date().toISOString(),
}

// ---------------------------------------------------------------------------
// SERVICE_GAP_RULES
// ---------------------------------------------------------------------------

describe('SERVICE_GAP_RULES', () => {
  it('contentieux_sans_audit: triggers when contentieux subscribed but not audit', () => {
    const rule = SERVICE_GAP_RULES.find((r) => r.id === 'contentieux_sans_audit')!
    const client = { ...baseClient, services_souscrits: ['contentieux'] }
    expect(rule.check(client)).toBe(true)
  })

  it('contentieux_sans_audit: does not trigger when audit is already subscribed', () => {
    const rule = SERVICE_GAP_RULES.find((r) => r.id === 'contentieux_sans_audit')!
    const client = { ...baseClient, services_souscrits: ['contentieux', 'audit'] }
    expect(rule.check(client)).toBe(false)
  })

  it('effectif_50_sans_formation: triggers for 50-250 without formation', () => {
    const rule = SERVICE_GAP_RULES.find((r) => r.id === 'effectif_50_sans_formation')!
    const client = { ...baseClient, effectif_tranche: 'de_50_250' as const, services_souscrits: [] }
    expect(rule.check(client)).toBe(true)
  })

  it('effectif_50_sans_formation: does not trigger for small companies', () => {
    const rule = SERVICE_GAP_RULES.find((r) => r.id === 'effectif_50_sans_formation')!
    const client = { ...baseClient, effectif_tranche: 'moins_11' as const, services_souscrits: [] }
    expect(rule.check(client)).toBe(false)
  })

  it('effectif_50_sans_formation: does not trigger when formation is subscribed', () => {
    const rule = SERVICE_GAP_RULES.find((r) => r.id === 'effectif_50_sans_formation')!
    const client = { ...baseClient, effectif_tranche: 'de_50_250' as const, services_souscrits: ['formation'] }
    expect(rule.check(client)).toBe(false)
  })

  it('sans_rgpd: triggers when conformite is missing', () => {
    const rule = SERVICE_GAP_RULES.find((r) => r.id === 'sans_rgpd')!
    const client = { ...baseClient, services_souscrits: [] }
    expect(rule.check(client)).toBe(true)
  })

  it('sans_rgpd: does not trigger when conformite is subscribed', () => {
    const rule = SERVICE_GAP_RULES.find((r) => r.id === 'sans_rgpd')!
    const client = { ...baseClient, services_souscrits: ['conformite'] }
    expect(rule.check(client)).toBe(false)
  })

  it('cdd_sans_conseil: triggers when contentieux subscribed but not conseil', () => {
    const rule = SERVICE_GAP_RULES.find((r) => r.id === 'cdd_sans_conseil')!
    const client = { ...baseClient, services_souscrits: ['contentieux'] }
    expect(rule.check(client)).toBe(true)
  })

  it('each rule generates an opportunity with required fields', () => {
    for (const rule of SERVICE_GAP_RULES) {
      const client = {
        ...baseClient,
        services_souscrits: [],
        effectif_tranche: 'de_50_250' as const,
      }
      if (rule.check(client)) {
        const opp = rule.generate(client, mockProspect)
        expect(opp.prospect_id).toBe('prospect-1')
        expect(opp.type).toBe('service_manquant')
        expect(typeof opp.titre).toBe('string')
        expect(typeof opp.description).toBe('string')
        expect(typeof opp.service_propose).toBe('string')
        expect(typeof opp.ca_estime).toBe('number')
        expect(opp.ca_estime).toBeGreaterThan(0)
      }
    }
  })
})

// ---------------------------------------------------------------------------
// SEASONAL_RULES
// ---------------------------------------------------------------------------

describe('SEASONAL_RULES', () => {
  it('nao: triggers in january for 50+ employees', () => {
    const rule = SEASONAL_RULES.find((r) => r.id === 'nao')!
    const client = { ...baseClient, effectif_tranche: 'de_50_250' as const }
    expect(rule.months.includes(1)).toBe(true)
    expect(rule.check(client)).toBe(true)
  })

  it('nao: does not trigger for small companies', () => {
    const rule = SEASONAL_RULES.find((r) => r.id === 'nao')!
    const client = { ...baseClient, effectif_tranche: 'moins_11' as const }
    expect(rule.check(client)).toBe(false)
  })

  it('entretiens_annuels: triggers in march for 11+ employees', () => {
    const rule = SEASONAL_RULES.find((r) => r.id === 'entretiens_annuels')!
    const client = { ...baseClient, effectif_tranche: 'de_11_50' as const }
    expect(rule.months.includes(3)).toBe(true)
    expect(rule.check(client)).toBe(true)
  })

  it('rentree_sociale: triggers in september for any company', () => {
    const rule = SEASONAL_RULES.find((r) => r.id === 'rentree_sociale')!
    expect(rule.months.includes(9)).toBe(true)
    expect(rule.check(baseClient)).toBe(true)
  })

  it('bilan_annuel: triggers in december', () => {
    const rule = SEASONAL_RULES.find((r) => r.id === 'bilan_annuel')!
    expect(rule.months.includes(12)).toBe(true)
    expect(rule.check(baseClient)).toBe(true)
  })

  it('each seasonal rule generates a valid opportunity', () => {
    for (const rule of SEASONAL_RULES) {
      const opp = rule.generate(baseClient, mockProspect, rule.months[0])
      expect(opp.prospect_id).toBe('prospect-1')
      expect(opp.type).toBe('saisonnalite')
      expect(typeof opp.titre).toBe('string')
      expect(opp.ca_estime).toBeGreaterThan(0)
    }
  })
})

// ---------------------------------------------------------------------------
// detectOpportunites
// ---------------------------------------------------------------------------

describe('detectOpportunites', () => {
  it('detects service gap opportunities', () => {
    const client: ClientIntelligence = {
      ...baseClient,
      services_souscrits: ['contentieux'],
      effectif_tranche: 'de_50_250',
    }
    const result = detectOpportunites(client, mockProspect, [], 6, [])
    const types = result.map((o) => o.type)
    expect(types).toContain('service_manquant')
  })

  it('detects actu_juridique opportunities', () => {
    const result = detectOpportunites(baseClient, mockProspect, [mockActu], 6, [])
    const types = result.map((o) => o.type)
    expect(types).toContain('actu_juridique')
  })

  it('detects seasonal opportunities in march', () => {
    const client: ClientIntelligence = { ...baseClient, effectif_tranche: 'de_11_50' }
    const result = detectOpportunites(client, mockProspect, [], 3, [])
    const types = result.map((o) => o.type)
    expect(types).toContain('saisonnalite')
  })

  it('does not duplicate existing non-expired opportunities', () => {
    const existing: Pick<OpportuniteIA, 'source' | 'service_propose' | 'statut'>[] = [
      {
        source: 'Absence de mise en conformité RGPD',
        service_propose: 'conformite',
        statut: 'nouvelle',
      },
    ]
    const result = detectOpportunites(baseClient, mockProspect, [], 6, existing)
    const conformiteOpps = result.filter((o) => o.service_propose === 'conformite' && o.source === 'Absence de mise en conformité RGPD')
    expect(conformiteOpps).toHaveLength(0)
  })

  it('allows duplicates when existing opportunity is refused', () => {
    const existing: Pick<OpportuniteIA, 'source' | 'service_propose' | 'statut'>[] = [
      {
        source: 'Absence de mise en conformité RGPD',
        service_propose: 'conformite',
        statut: 'refusee',
      },
    ]
    const result = detectOpportunites(baseClient, mockProspect, [], 6, existing)
    const conformiteOpps = result.filter(
      (o) => o.service_propose === 'conformite' && o.source === 'Absence de mise en conformité RGPD'
    )
    expect(conformiteOpps.length).toBeGreaterThan(0)
  })

  it('sets statut to nouvelle by default', () => {
    const result = detectOpportunites(baseClient, mockProspect, [], 6, [])
    result.forEach((o) => {
      expect(o.statut).toBe('nouvelle')
    })
  })

  it('sets email_genere and proposition_generee to null by default', () => {
    const result = detectOpportunites(baseClient, mockProspect, [], 6, [])
    result.forEach((o) => {
      expect(o.email_genere).toBeNull()
      expect(o.proposition_generee).toBeNull()
    })
  })

  it('does not match actu if client is not in clients_concernes_ids', () => {
    const actu: ActuImpact = {
      ...mockActu,
      clients_concernes_ids: ['other-prospect-id'],
    }
    const result = detectOpportunites(baseClient, mockProspect, [actu], 6, [])
    const actuOpps = result.filter((o) => o.type === 'actu_juridique')
    expect(actuOpps).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// calculateScore
// ---------------------------------------------------------------------------

describe('calculateScore', () => {
  it('returns 0 for client with no opportunities', () => {
    const score = calculateScore(baseClient, [])
    expect(score).toBe(0)
  })

  it('increases with number of active opportunities', () => {
    const opps: Pick<OpportuniteIA, 'statut' | 'ca_estime'>[] = [
      { statut: 'nouvelle', ca_estime: 3500 },
      { statut: 'nouvelle', ca_estime: 2000 },
    ]
    const score = calculateScore(baseClient, opps)
    expect(score).toBeGreaterThan(0)
  })

  it('caps at 100', () => {
    const opps: Pick<OpportuniteIA, 'statut' | 'ca_estime'>[] = Array(20).fill({
      statut: 'nouvelle',
      ca_estime: 50000,
    })
    const score = calculateScore(
      { ...baseClient, effectif_tranche: 'plus_250' },
      opps
    )
    expect(score).toBe(100)
  })

  it('gives higher score for larger companies', () => {
    const opps: Pick<OpportuniteIA, 'statut' | 'ca_estime'>[] = [
      { statut: 'nouvelle', ca_estime: 3000 },
    ]
    const small = calculateScore({ ...baseClient, effectif_tranche: 'moins_11' }, opps)
    const large = calculateScore({ ...baseClient, effectif_tranche: 'plus_250' }, opps)
    expect(large).toBeGreaterThan(small)
  })

  it('does not count refused or expired opportunities', () => {
    const opps: Pick<OpportuniteIA, 'statut' | 'ca_estime'>[] = [
      { statut: 'refusee', ca_estime: 50000 },
      { statut: 'expiree', ca_estime: 50000 },
    ]
    const score = calculateScore(baseClient, opps)
    // No active opportunities → base score from effectif only
    expect(score).toBeLessThanOrEqual(20)
  })
})

// ---------------------------------------------------------------------------
// Labels and utilities
// ---------------------------------------------------------------------------

describe('EFFECTIF_LABELS', () => {
  it('has labels for all effectif tranches', () => {
    expect(EFFECTIF_LABELS.moins_11).toBeTruthy()
    expect(EFFECTIF_LABELS.de_11_50).toBeTruthy()
    expect(EFFECTIF_LABELS.de_50_250).toBeTruthy()
    expect(EFFECTIF_LABELS.plus_250).toBeTruthy()
  })
})

describe('OPPORTUNITE_TYPE_LABELS', () => {
  it('has labels for all types', () => {
    expect(OPPORTUNITE_TYPE_LABELS.service_manquant).toBeTruthy()
    expect(OPPORTUNITE_TYPE_LABELS.actu_juridique).toBeTruthy()
    expect(OPPORTUNITE_TYPE_LABELS.saisonnalite).toBeTruthy()
  })
})

describe('OPPORTUNITE_STATUT_LABELS', () => {
  it('has labels for all statuts', () => {
    const statuts = ['nouvelle', 'vue', 'proposee', 'acceptee', 'refusee', 'expiree']
    statuts.forEach((s) => {
      expect(OPPORTUNITE_STATUT_LABELS[s]).toBeTruthy()
    })
  })
})

describe('ACTU_SOURCE_LABELS', () => {
  it('has labels for all source types', () => {
    const types = ['decret', 'jurisprudence', 'reforme', 'loi', 'circulaire']
    types.forEach((t) => {
      expect(ACTU_SOURCE_LABELS[t]).toBeTruthy()
    })
  })
})

describe('SERVICE_LABELS', () => {
  it('has labels for all services', () => {
    const services = ['contentieux', 'conseil', 'conformite', 'formation', 'audit', 'autre']
    services.forEach((s) => {
      expect(SERVICE_LABELS[s]).toBeTruthy()
    })
  })
})

describe('ALL_SERVICES', () => {
  it('contains all main service categories', () => {
    expect(ALL_SERVICES).toContain('contentieux')
    expect(ALL_SERVICES).toContain('conseil')
    expect(ALL_SERVICES).toContain('conformite')
    expect(ALL_SERVICES).toContain('formation')
    expect(ALL_SERVICES).toContain('audit')
  })
})

describe('opportuniteStatutColor', () => {
  it('returns a color string for each statut', () => {
    const statuts = ['nouvelle', 'vue', 'proposee', 'acceptee', 'refusee', 'expiree']
    statuts.forEach((s) => {
      const color = opportuniteStatutColor(s)
      expect(color).toMatch(/^#[0-9a-f]{6}$/i)
    })
  })

  it('returns orange for nouvelle', () => {
    expect(opportuniteStatutColor('nouvelle')).toBe('#e8842c')
  })

  it('returns green for acceptee', () => {
    expect(opportuniteStatutColor('acceptee')).toBe('#10b981')
  })

  it('returns fallback for unknown statut', () => {
    expect(opportuniteStatutColor('unknown')).toBe('#6b7280')
  })
})

describe('opportuniteStatutBg', () => {
  it('returns a background color for each statut', () => {
    const statuts = ['nouvelle', 'vue', 'proposee', 'acceptee', 'refusee', 'expiree']
    statuts.forEach((s) => {
      const bg = opportuniteStatutBg(s)
      expect(bg).toMatch(/^#[0-9a-f]{6}$/i)
    })
  })
})

describe('opportuniteTypeIcon', () => {
  it('returns an emoji for each type', () => {
    expect(opportuniteTypeIcon('service_manquant')).toBeTruthy()
    expect(opportuniteTypeIcon('actu_juridique')).toBeTruthy()
    expect(opportuniteTypeIcon('saisonnalite')).toBeTruthy()
  })

  it('returns default for unknown type', () => {
    const icon = opportuniteTypeIcon('unknown')
    expect(typeof icon).toBe('string')
    expect(icon.length).toBeGreaterThan(0)
  })
})
