import {
  detecterOpportunites,
  calculerScore,
  effectifLabel,
  serviceLabel,
  sourceTypeLabel,
  opportuniteStatutLabel,
  opportuniteStatutColor,
} from '@/lib/intelligence/engine'
import type { ClientIntelligence, OpportuniteIA } from '@/lib/types'

const baseCI = (): ClientIntelligence => ({
  id: 'ci-1',
  prospect_id: 'p-1',
  secteur: 'Transport & Logistique',
  code_naf: '4941A',
  idcc: '16',
  effectif_tranche: '50_250',
  services_souscrits: ['contentieux'],
  score_opportunite: 0,
  updated_at: new Date().toISOString(),
  prospect: {
    id: 'p-1',
    company_name: 'Test SARL',
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
})

const noOpps: OpportuniteIA[] = []

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

describe('effectifLabel', () => {
  it('retourne le bon label pour chaque tranche', () => {
    expect(effectifLabel('moins_11')).toBe('Moins de 11 salariés')
    expect(effectifLabel('11_50')).toBe('11 à 50 salariés')
    expect(effectifLabel('50_250')).toBe('50 à 250 salariés')
    expect(effectifLabel('250_plus')).toBe('Plus de 250 salariés')
  })

  it('retourne un fallback pour une valeur inconnue', () => {
    expect(effectifLabel(null)).toBe('Effectif non renseigné')
    expect(effectifLabel('inconnu')).toBe('Effectif non renseigné')
  })
})

describe('serviceLabel', () => {
  it('retourne le bon label pour chaque service', () => {
    expect(serviceLabel('audit_rh')).toBe('Audit préventif RH')
    expect(serviceLabel('formation_managers')).toBe('Formation managers')
    expect(serviceLabel('audit_rgpd')).toBe('Audit RGPD')
    expect(serviceLabel('conseil_contrats')).toBe('Conseil & sécurisation contrats')
    expect(serviceLabel('nao')).toBe('Accompagnement NAO')
    expect(serviceLabel('bilan_social')).toBe('Bilan social')
    expect(serviceLabel('entretiens_pro')).toBe('Entretiens professionnels')
    expect(serviceLabel('rentree_sociale')).toBe('Audit social de rentrée')
    expect(serviceLabel('info_collective')).toBe('Information collective')
    expect(serviceLabel('securisation_contrats')).toBe('Sécurisation contrats CDD/freelance')
    expect(serviceLabel('contentieux')).toBe('Contentieux')
  })
})

describe('sourceTypeLabel', () => {
  it('retourne les bons labels', () => {
    expect(sourceTypeLabel('decret')).toBe('Décret')
    expect(sourceTypeLabel('jurisprudence')).toBe('Jurisprudence')
    expect(sourceTypeLabel('reforme')).toBe('Réforme législative')
    expect(sourceTypeLabel('ccn')).toBe('Convention collective')
    expect(sourceTypeLabel('autre')).toBe('Actualité juridique')
  })
})

describe('opportuniteStatutLabel', () => {
  it('retourne les bons labels', () => {
    expect(opportuniteStatutLabel('detectee')).toBe('Détectée')
    expect(opportuniteStatutLabel('en_cours')).toBe('En cours')
    expect(opportuniteStatutLabel('envoyee')).toBe('Envoyée')
    expect(opportuniteStatutLabel('convertie')).toBe('Convertie')
    expect(opportuniteStatutLabel('ignoree')).toBe('Ignorée')
  })
})

describe('opportuniteStatutColor', () => {
  it('retourne une couleur hexadécimale pour chaque statut', () => {
    const statuts = ['detectee', 'en_cours', 'envoyee', 'convertie', 'ignoree']
    for (const s of statuts) {
      const color = opportuniteStatutColor(s)
      expect(color).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})

// ---------------------------------------------------------------------------
// Détection des opportunités
// ---------------------------------------------------------------------------

describe('detecterOpportunites — règle contentieux sans audit', () => {
  it('détecte audit_rh si le client a des contentieux sans audit', () => {
    const ci = baseCI()
    const opps = detecterOpportunites(ci, noOpps)
    const auditRh = opps.find((o) => o.service_propose === 'audit_rh')
    expect(auditRh).toBeDefined()
    expect(auditRh?.type).toBe('service_manquant')
  })

  it('ne détecte pas audit_rh si le client a déjà souscrit audit_rh', () => {
    const ci = { ...baseCI(), services_souscrits: ['contentieux', 'audit_rh'] }
    const opps = detecterOpportunites(ci, noOpps)
    expect(opps.find((o) => o.service_propose === 'audit_rh')).toBeUndefined()
  })

  it('ne détecte pas audit_rh si le client n\'a pas de contentieux', () => {
    const ci = { ...baseCI(), services_souscrits: ['conseil_contrats'] }
    const opps = detecterOpportunites(ci, noOpps)
    expect(opps.find((o) => o.service_propose === 'audit_rh')).toBeUndefined()
  })

  it('ne re-détecte pas si une opportunité audit_rh active existe déjà', () => {
    const ci = baseCI()
    const existante: OpportuniteIA = {
      id: 'opp-1',
      prospect_id: 'p-1',
      type: 'service_manquant',
      source: 'regle_contentieux_sans_audit',
      titre: 'Audit RH',
      description: 'desc',
      service_propose: 'audit_rh',
      ca_estime: 4500,
      statut: 'detectee',
      email_genere: null,
      proposition_generee: null,
      created_at: new Date().toISOString(),
    }
    const opps = detecterOpportunites(ci, [existante])
    expect(opps.find((o) => o.service_propose === 'audit_rh')).toBeUndefined()
  })
})

describe('detecterOpportunites — règle effectif 50+ sans formation', () => {
  it('détecte formation_managers pour 50_250 salariés sans formation', () => {
    const ci = baseCI()
    const opps = detecterOpportunites(ci, noOpps)
    const formation = opps.find((o) => o.service_propose === 'formation_managers')
    expect(formation).toBeDefined()
    expect(formation?.type).toBe('service_manquant')
  })

  it('ne détecte pas formation_managers pour moins_11 salariés', () => {
    const ci = { ...baseCI(), effectif_tranche: 'moins_11' as const }
    const opps = detecterOpportunites(ci, noOpps)
    expect(opps.find((o) => o.service_propose === 'formation_managers')).toBeUndefined()
  })

  it('détecte formation_managers pour 250_plus salariés', () => {
    const ci = { ...baseCI(), effectif_tranche: '250_plus' as const }
    const opps = detecterOpportunites(ci, noOpps)
    expect(opps.find((o) => o.service_propose === 'formation_managers')).toBeDefined()
  })
})

describe('detecterOpportunites — règle RGPD', () => {
  it('détecte audit_rgpd pour secteur tech sans RGPD', () => {
    const ci: ClientIntelligence = {
      ...baseCI(),
      secteur: 'Technologies & Numérique',
      services_souscrits: ['conseil_contrats'],
    }
    const opps = detecterOpportunites(ci, noOpps)
    expect(opps.find((o) => o.service_propose === 'audit_rgpd')).toBeDefined()
  })

  it('ne détecte pas audit_rgpd si déjà souscrit', () => {
    const ci: ClientIntelligence = {
      ...baseCI(),
      secteur: 'Technologies & Numérique',
      services_souscrits: ['audit_rgpd'],
    }
    const opps = detecterOpportunites(ci, noOpps)
    expect(opps.find((o) => o.service_propose === 'audit_rgpd')).toBeUndefined()
  })
})

describe('detecterOpportunites — règle CDD', () => {
  it('détecte securisation_contrats pour secteur transport sans ce service', () => {
    const ci: ClientIntelligence = {
      ...baseCI(),
      secteur: 'Transport & Logistique',
      services_souscrits: [],
    }
    const opps = detecterOpportunites(ci, noOpps)
    expect(opps.find((o) => o.service_propose === 'securisation_contrats')).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Calcul du score
// ---------------------------------------------------------------------------

describe('calculerScore', () => {
  it('retourne 0 pour un client sans opportunités', () => {
    expect(calculerScore(baseCI(), [])).toBe(0)
  })

  it('retourne un score > 0 avec des opportunités actives', () => {
    const opps: OpportuniteIA[] = [
      {
        id: '1',
        prospect_id: 'p-1',
        type: 'service_manquant',
        source: null,
        titre: 'Test',
        description: 'desc',
        service_propose: 'audit_rh',
        ca_estime: 5000,
        statut: 'detectee',
        email_genere: null,
        proposition_generee: null,
        created_at: new Date().toISOString(),
      },
    ]
    const score = calculerScore(baseCI(), opps)
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('ne compte pas les opportunités ignorées ou converties dans le score', () => {
    const oppIgnoree: OpportuniteIA = {
      id: '1',
      prospect_id: 'p-1',
      type: 'service_manquant',
      source: null,
      titre: 'Test',
      description: 'desc',
      service_propose: 'audit_rh',
      ca_estime: 10000,
      statut: 'ignoree',
      email_genere: null,
      proposition_generee: null,
      created_at: new Date().toISOString(),
    }
    expect(calculerScore(baseCI(), [oppIgnoree])).toBe(0)
  })

  it('le score ne dépasse jamais 100', () => {
    const opps: OpportuniteIA[] = Array.from({ length: 20 }, (_, i) => ({
      id: String(i),
      prospect_id: 'p-1',
      type: 'service_manquant' as const,
      source: null,
      titre: 'Test',
      description: 'desc',
      service_propose: 'audit_rh' as const,
      ca_estime: 50000,
      statut: 'detectee' as const,
      email_genere: null,
      proposition_generee: null,
      created_at: new Date().toISOString(),
    }))
    expect(calculerScore(baseCI(), opps)).toBeLessThanOrEqual(100)
  })
})
