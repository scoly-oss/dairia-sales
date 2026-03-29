import {
  SERVICES,
  getServiceLabel,
  getTypeLabel,
  getStatutLabel,
  getEffectifLabel,
  detectOpportunites,
  calculateScore,
} from '@/lib/intelligence/engine'
import type { ClientIntelligence, OpportuniteIA, ActuImpact } from '@/lib/types'

// Helpers
function makeClient(overrides: Partial<ClientIntelligence> = {}): ClientIntelligence {
  return {
    id: 'client-test-1',
    organisation_id: null,
    contact_id: null,
    organisation_nom: 'Client Test',
    secteur: 'commerce',
    code_naf: null,
    idcc: null,
    idcc_libelle: null,
    effectif_tranche: '-11',
    services_souscrits: [],
    score_opportunite: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

function makeOpp(overrides: Partial<OpportuniteIA> = {}): OpportuniteIA {
  return {
    id: 'opp-1',
    client_intelligence_id: 'client-test-1',
    organisation_id: null,
    organisation_nom: null,
    type: 'services_manquants',
    source: 'rule_test',
    titre: 'Test',
    description: null,
    service_propose: null,
    ca_estime: 0,
    statut: 'nouvelle',
    actu_id: null,
    email_genere: null,
    proposition_generee: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

function makeActu(overrides: Partial<ActuImpact> = {}): ActuImpact {
  return {
    id: 'actu-1',
    source_type: 'decret',
    source_ref: 'Décret test',
    titre: 'Décret de test',
    resume: 'Résumé du décret de test',
    clients_concernes_ids: [],
    services_concernes: ['entretiens_pro'],
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

// ============================================================
// SERVICES constant
// ============================================================
describe('SERVICES', () => {
  it('contient audit_rh', () => {
    expect(SERVICES.audit_rh).toBe('Audit des pratiques RH')
  })

  it('contient formation_managers', () => {
    expect(SERVICES.formation_managers).toBe('Formation managers')
  })

  it('contient audit_rgpd', () => {
    expect(SERVICES.audit_rgpd).toBe('Audit RGPD')
  })

  it('contient accompagnement_nao', () => {
    expect(SERVICES.accompagnement_nao).toBe('Accompagnement NAO')
  })

  it('contient tous les services requis', () => {
    const required = ['audit_rh', 'formation_managers', 'audit_rgpd', 'securisation_contrats', 'accompagnement_nao', 'entretiens_pro', 'bilan_social', 'previsionnel_juridique', 'conseil_disciplinaire', 'information_collective']
    required.forEach((key) => {
      expect(SERVICES[key]).toBeDefined()
    })
  })
})

// ============================================================
// Labels
// ============================================================
describe('getServiceLabel', () => {
  it('retourne le label pour audit_rh', () => {
    expect(getServiceLabel('audit_rh')).toBe('Audit des pratiques RH')
  })

  it('retourne la clé inchangée si service inconnu', () => {
    expect(getServiceLabel('service_inconnu')).toBe('service_inconnu')
  })
})

describe('getTypeLabel', () => {
  it('retourne le label pour services_manquants', () => {
    expect(getTypeLabel('services_manquants')).toBe('Service manquant')
  })

  it('retourne le label pour saisonnalite', () => {
    expect(getTypeLabel('saisonnalite')).toBe('Opportunité saisonnière')
  })

  it('retourne le label pour actu_juridique', () => {
    expect(getTypeLabel('actu_juridique')).toBe('Actualité juridique')
  })

  it('retourne la valeur brute si type inconnu', () => {
    expect(getTypeLabel('type_inconnu')).toBe('type_inconnu')
  })
})

describe('getStatutLabel', () => {
  it('retourne Nouvelle', () => expect(getStatutLabel('nouvelle')).toBe('Nouvelle'))
  it('retourne En cours', () => expect(getStatutLabel('en_cours')).toBe('En cours'))
  it('retourne Gagnée', () => expect(getStatutLabel('gagnee')).toBe('Gagnée'))
  it('retourne Perdue', () => expect(getStatutLabel('perdue')).toBe('Perdue'))
  it('retourne Ignorée', () => expect(getStatutLabel('ignoree')).toBe('Ignorée'))
})

describe('getEffectifLabel', () => {
  it('retourne le label pour -11', () => {
    expect(getEffectifLabel('-11')).toBe('Moins de 11 salariés')
  })

  it('retourne le label pour 50-250', () => {
    expect(getEffectifLabel('50-250')).toBe('50 à 250 salariés')
  })

  it('retourne Non renseigné pour null', () => {
    expect(getEffectifLabel(null)).toBe('Non renseigné')
  })
})

// ============================================================
// Règles services manquants
// ============================================================
describe('detectOpportunites — services manquants', () => {
  it('détecte audit_rh si contentieux sans audit', () => {
    const client = makeClient({ services_souscrits: ['contentieux'] })
    const opps = detectOpportunites(client, [], [], new Date('2026-06-15'))
    const auditOpp = opps.find((o) => o.source === 'rule_contentieux_audit')
    expect(auditOpp).toBeDefined()
    expect(auditOpp?.service_propose).toBe('audit_rh')
    expect(auditOpp?.type).toBe('services_manquants')
  })

  it('ne détecte pas audit_rh si déjà souscrit', () => {
    const client = makeClient({ services_souscrits: ['contentieux', 'audit_rh'] })
    const opps = detectOpportunites(client, [], [], new Date('2026-06-15'))
    expect(opps.find((o) => o.source === 'rule_contentieux_audit')).toBeUndefined()
  })

  it('détecte formation_managers pour 50+ salariés sans formation', () => {
    const client = makeClient({ effectif_tranche: '50-250', services_souscrits: [] })
    const opps = detectOpportunites(client, [], [], new Date('2026-06-15'))
    const formOpp = opps.find((o) => o.source === 'rule_50_formation')
    expect(formOpp).toBeDefined()
    expect(formOpp?.service_propose).toBe('formation_managers')
  })

  it('ne détecte pas formation_managers pour -11 salariés', () => {
    const client = makeClient({ effectif_tranche: '-11', services_souscrits: [] })
    const opps = detectOpportunites(client, [], [], new Date('2026-06-15'))
    expect(opps.find((o) => o.source === 'rule_50_formation')).toBeUndefined()
  })

  it('détecte audit_rgpd pour secteur tech sans RGPD', () => {
    const client = makeClient({ secteur: 'tech', services_souscrits: [] })
    const opps = detectOpportunites(client, [], [], new Date('2026-06-15'))
    const rgpdOpp = opps.find((o) => o.source === 'rule_rgpd')
    expect(rgpdOpp).toBeDefined()
    expect(rgpdOpp?.service_propose).toBe('audit_rgpd')
  })

  it('ne détecte pas audit_rgpd pour secteur non sensible', () => {
    const client = makeClient({ secteur: 'restauration', services_souscrits: [] })
    const opps = detectOpportunites(client, [], [], new Date('2026-06-15'))
    expect(opps.find((o) => o.source === 'rule_rgpd')).toBeUndefined()
  })

  it('détecte securisation_contrats si cdd_nombreux sans conseil contrats', () => {
    const client = makeClient({ services_souscrits: ['cdd_nombreux'] })
    const opps = detectOpportunites(client, [], [], new Date('2026-06-15'))
    const cddOpp = opps.find((o) => o.source === 'rule_cdd_securisation')
    expect(cddOpp).toBeDefined()
    expect(cddOpp?.service_propose).toBe('securisation_contrats')
  })
})

// ============================================================
// Règles saisonnières
// ============================================================
describe('detectOpportunites — saisonnalité', () => {
  it('détecte accompagnement_nao en janvier', () => {
    const client = makeClient({ services_souscrits: [] })
    const opps = detectOpportunites(client, [], [], new Date('2026-01-15'))
    const naoOpp = opps.find((o) => o.source === 'seasonal_january_nao')
    expect(naoOpp).toBeDefined()
    expect(naoOpp?.service_propose).toBe('accompagnement_nao')
    expect(naoOpp?.type).toBe('saisonnalite')
  })

  it('ne détecte pas NAO si déjà souscrit', () => {
    const client = makeClient({ services_souscrits: ['accompagnement_nao'] })
    const opps = detectOpportunites(client, [], [], new Date('2026-01-15'))
    expect(opps.find((o) => o.source === 'seasonal_january_nao')).toBeUndefined()
  })

  it('détecte entretiens_pro en mars pour 50+ salariés', () => {
    const client = makeClient({ effectif_tranche: '250+', services_souscrits: [] })
    const opps = detectOpportunites(client, [], [], new Date('2026-03-20'))
    const ep = opps.find((o) => o.source === 'seasonal_march')
    expect(ep).toBeDefined()
    expect(ep?.service_propose).toBe('entretiens_pro')
  })

  it('ne détecte pas entretiens_pro en mars pour -11 salariés', () => {
    const client = makeClient({ effectif_tranche: '-11', services_souscrits: [] })
    const opps = detectOpportunites(client, [], [], new Date('2026-03-20'))
    expect(opps.find((o) => o.source === 'seasonal_march')).toBeUndefined()
  })

  it('détecte bilan_social en septembre', () => {
    const client = makeClient({ services_souscrits: [] })
    const opps = detectOpportunites(client, [], [], new Date('2026-09-01'))
    const bs = opps.find((o) => o.source === 'seasonal_september')
    expect(bs).toBeDefined()
    expect(bs?.service_propose).toBe('bilan_social')
  })

  it('détecte previsionnel_juridique en décembre', () => {
    const client = makeClient({ services_souscrits: [] })
    const opps = detectOpportunites(client, [], [], new Date('2026-12-01'))
    const pj = opps.find((o) => o.source === 'seasonal_december')
    expect(pj).toBeDefined()
    expect(pj?.service_propose).toBe('previsionnel_juridique')
  })

  it('ne détecte pas de règle saisonnière en juin', () => {
    const client = makeClient({ services_souscrits: [], effectif_tranche: '50-250' })
    const opps = detectOpportunites(client, [], [], new Date('2026-06-15'))
    const seasonal = opps.filter((o) => o.type === 'saisonnalite')
    expect(seasonal).toHaveLength(0)
  })
})

// ============================================================
// Règles actu juridique
// ============================================================
describe('detectOpportunites — actu_juridique', () => {
  it('détecte une opportunité quand le client est dans clients_concernes_ids', () => {
    const client = makeClient({ id: 'client-concerné' })
    const actu = makeActu({ clients_concernes_ids: ['client-concerné'], services_concernes: ['entretiens_pro'] })
    const opps = detectOpportunites(client, [], [actu], new Date('2026-06-15'))
    const actOpp = opps.find((o) => o.type === 'actu_juridique')
    expect(actOpp).toBeDefined()
    expect(actOpp?.actu_id).toBe('actu-1')
    expect(actOpp?.service_propose).toBe('entretiens_pro')
  })

  it('ne détecte pas si client non concerné', () => {
    const client = makeClient({ id: 'client-non-concerné' })
    const actu = makeActu({ clients_concernes_ids: ['autre-client'] })
    const opps = detectOpportunites(client, [], [actu], new Date('2026-06-15'))
    expect(opps.find((o) => o.type === 'actu_juridique')).toBeUndefined()
  })
})

// ============================================================
// Déduplication
// ============================================================
describe('déduplication', () => {
  it('ne recrée pas une opportunité déjà active (même source)', () => {
    const client = makeClient({ services_souscrits: ['contentieux'] })
    const existingOpp = makeOpp({ source: 'rule_contentieux_audit', statut: 'nouvelle' })
    const opps = detectOpportunites(client, [existingOpp], [], new Date('2026-06-15'))
    expect(opps.find((o) => o.source === 'rule_contentieux_audit')).toBeUndefined()
  })

  it('recrée une opportunité si la précédente est gagnée', () => {
    const client = makeClient({ services_souscrits: ['contentieux'] })
    const existingOpp = makeOpp({ source: 'rule_contentieux_audit', statut: 'gagnee' })
    const opps = detectOpportunites(client, [existingOpp], [], new Date('2026-06-15'))
    expect(opps.find((o) => o.source === 'rule_contentieux_audit')).toBeDefined()
  })
})

// ============================================================
// calculateScore
// ============================================================
describe('calculateScore', () => {
  it('retourne 0 pour un client sans opportunités', () => {
    const client = makeClient()
    const score = calculateScore(client, [], [])
    expect(score).toBe(0)
  })

  it('augmente avec le nombre d\'opportunités', () => {
    const client = makeClient()
    const newOpps = [
      { service_propose: 'audit_rh', ca_estime: 3500 } as Parameters<typeof calculateScore>[2][0],
      { service_propose: 'audit_rgpd', ca_estime: 4500 } as Parameters<typeof calculateScore>[2][0],
    ]
    const score = calculateScore(client, [], newOpps)
    expect(score).toBeGreaterThan(0)
  })

  it('ne dépasse pas 100', () => {
    const client = makeClient()
    const newOpps = Array.from({ length: 20 }, (_, i) => ({
      service_propose: 'audit_rh',
      ca_estime: 10000 * i,
    })) as Parameters<typeof calculateScore>[2]
    const score = calculateScore(client, [], newOpps)
    expect(score).toBeLessThanOrEqual(100)
  })
})
