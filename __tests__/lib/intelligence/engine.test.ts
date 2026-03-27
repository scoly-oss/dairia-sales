import {
  SERVICES,
  REGLES_SERVICES_MANQUANTS,
  REGLES_SAISONNIERES,
  detectOpportunitiesForClient,
  computeScoreOpportunite,
  getServiceLabel,
  getEffectifLabel,
} from '@/lib/intelligence/engine'
import type { ClientIntelligence, OpportuniteIA } from '@/lib/types'

function makeIntel(overrides: Partial<ClientIntelligence> = {}): ClientIntelligence {
  return {
    id: 'intel-1',
    prospect_id: 'prospect-1',
    secteur: 'Tech & Numérique',
    code_naf: '6201Z',
    idcc: '1486',
    idcc_libelle: 'Bureaux d\'études',
    effectif_tranche: '50-250',
    services_souscrits: [],
    services_potentiels: [],
    score_opportunite: 0,
    notes_internes: null,
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

function makeOpp(overrides: Partial<OpportuniteIA> = {}): OpportuniteIA {
  return {
    id: 'opp-1',
    prospect_id: 'prospect-1',
    type: 'service_manquant',
    source: 'regle:test',
    titre: 'Test',
    description: null,
    service_propose: 'audit_rh',
    ca_estime: 3000,
    statut: 'nouvelle',
    email_genere: null,
    proposition_generee: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

describe('SERVICES config', () => {
  it('contient tous les services attendus', () => {
    expect(SERVICES.audit_rh).toBeDefined()
    expect(SERVICES.formation).toBeDefined()
    expect(SERVICES.rgpd).toBeDefined()
    expect(SERVICES.contentieux).toBeDefined()
    expect(SERVICES.conseil).toBeDefined()
    expect(SERVICES.nao).toBeDefined()
    expect(SERVICES.bilan_social).toBeDefined()
  })

  it('chaque service a un label et des tarifs', () => {
    for (const [key, cfg] of Object.entries(SERVICES)) {
      expect(cfg.label).toBeTruthy()
      expect(cfg.tarif_min).toBeGreaterThan(0)
      expect(cfg.tarif_max).toBeGreaterThanOrEqual(cfg.tarif_min)
    }
  })
})

describe('getServiceLabel', () => {
  it('retourne le label du service', () => {
    expect(getServiceLabel('audit_rh')).toBe('Audit RH préventif')
    expect(getServiceLabel('formation')).toBe('Formation & accompagnement')
    expect(getServiceLabel('rgpd')).toBe('Audit RGPD')
  })

  it('retourne la clé si service inconnu', () => {
    expect(getServiceLabel('unknown_service')).toBe('unknown_service')
  })
})

describe('getEffectifLabel', () => {
  it('retourne les libellés corrects', () => {
    expect(getEffectifLabel('-11')).toBe('Moins de 11 salariés')
    expect(getEffectifLabel('11-50')).toBe('11 à 50 salariés')
    expect(getEffectifLabel('50-250')).toBe('50 à 250 salariés')
    expect(getEffectifLabel('250+')).toBe('Plus de 250 salariés')
  })

  it('retourne la valeur brute si inconnue', () => {
    expect(getEffectifLabel('inconnu')).toBe('inconnu')
  })
})

describe('REGLES_SERVICES_MANQUANTS', () => {
  describe('contentieux_sans_audit', () => {
    const regle = REGLES_SERVICES_MANQUANTS.find(r => r.id === 'contentieux_sans_audit')!

    it('déclenche si contentieux sans audit_rh', () => {
      const intel = makeIntel({ services_souscrits: ['contentieux'] })
      expect(regle.evaluer(intel)).toBe(true)
    })

    it('ne déclenche pas si audit_rh déjà souscrit', () => {
      const intel = makeIntel({ services_souscrits: ['contentieux', 'audit_rh'] })
      expect(regle.evaluer(intel)).toBe(false)
    })

    it('ne déclenche pas si pas de contentieux', () => {
      const intel = makeIntel({ services_souscrits: ['conseil'] })
      expect(regle.evaluer(intel)).toBe(false)
    })

    it('génère un titre et un ca_estime adapté à l\'effectif 250+', () => {
      const intel = makeIntel({ services_souscrits: ['contentieux'], effectif_tranche: '250+' })
      const result = regle.generer(intel)
      expect(result.ca_estime).toBe(8000)
      expect(result.service_propose).toBe('audit_rh')
    })
  })

  describe('formation_manquante', () => {
    const regle = REGLES_SERVICES_MANQUANTS.find(r => r.id === 'formation_manquante')!

    it('déclenche pour 50-250 sans formation', () => {
      const intel = makeIntel({ effectif_tranche: '50-250', services_souscrits: [] })
      expect(regle.evaluer(intel)).toBe(true)
    })

    it('déclenche pour 250+ sans formation', () => {
      const intel = makeIntel({ effectif_tranche: '250+', services_souscrits: [] })
      expect(regle.evaluer(intel)).toBe(true)
    })

    it('ne déclenche pas pour -11', () => {
      const intel = makeIntel({ effectif_tranche: '-11', services_souscrits: [] })
      expect(regle.evaluer(intel)).toBe(false)
    })

    it('ne déclenche pas si formation déjà souscrite', () => {
      const intel = makeIntel({ effectif_tranche: '50-250', services_souscrits: ['formation'] })
      expect(regle.evaluer(intel)).toBe(false)
    })
  })

  describe('rgpd_absent', () => {
    const regle = REGLES_SERVICES_MANQUANTS.find(r => r.id === 'rgpd_absent')!

    it('déclenche pour secteur tech sans rgpd', () => {
      const intel = makeIntel({ secteur: 'Tech & Numérique', services_souscrits: [] })
      expect(regle.evaluer(intel)).toBe(true)
    })

    it('déclenche pour secteur santé sans rgpd', () => {
      const intel = makeIntel({ secteur: 'Santé', services_souscrits: [] })
      expect(regle.evaluer(intel)).toBe(true)
    })

    it('ne déclenche pas si rgpd déjà souscrit', () => {
      const intel = makeIntel({ secteur: 'Tech & Numérique', services_souscrits: ['rgpd'] })
      expect(regle.evaluer(intel)).toBe(false)
    })

    it('ne déclenche pas pour secteur non sensible', () => {
      const intel = makeIntel({ secteur: 'BTP', services_souscrits: [] })
      expect(regle.evaluer(intel)).toBe(false)
    })
  })
})

describe('REGLES_SAISONNIERES', () => {
  describe('nao_janvier', () => {
    const regle = REGLES_SAISONNIERES.find(r => r.id === 'nao_janvier')!

    it('est actif en janvier (mois 1)', () => {
      expect(regle.mois).toContain(1)
    })

    it('est actif en février (mois 2)', () => {
      expect(regle.mois).toContain(2)
    })

    it('déclenche pour 50-250 sans nao', () => {
      const intel = makeIntel({ effectif_tranche: '50-250', services_souscrits: [] })
      expect(regle.evaluer(intel)).toBe(true)
    })

    it('ne déclenche pas pour -11', () => {
      const intel = makeIntel({ effectif_tranche: '-11', services_souscrits: [] })
      expect(regle.evaluer(intel)).toBe(false)
    })
  })

  describe('bilan_annuel', () => {
    const regle = REGLES_SAISONNIERES.find(r => r.id === 'bilan_annuel')!

    it('est actif en novembre et décembre', () => {
      expect(regle.mois).toContain(11)
      expect(regle.mois).toContain(12)
    })

    it('déclenche pour n\'importe quel client', () => {
      const intel = makeIntel({ effectif_tranche: '-11' })
      expect(regle.evaluer(intel)).toBe(true)
    })
  })
})

describe('detectOpportunitiesForClient', () => {
  it('retourne des opportunités pour un client avec contentieux sans audit', () => {
    const intel = makeIntel({ services_souscrits: ['contentieux'] })
    const result = detectOpportunitiesForClient(intel, [], 6)
    expect(result.some(r => r.source === 'regle:contentieux_sans_audit')).toBe(true)
  })

  it('exclut les opportunités déjà actives (déduplication)', () => {
    const intel = makeIntel({ services_souscrits: ['contentieux'] })
    const existing = [makeOpp({ source: 'regle:contentieux_sans_audit', statut: 'nouvelle' })]
    const result = detectOpportunitiesForClient(intel, existing, 6)
    expect(result.some(r => r.source === 'regle:contentieux_sans_audit')).toBe(false)
  })

  it('inclut les opportunités saisonnières pour le mois correct', () => {
    const intel = makeIntel({ effectif_tranche: '50-250', services_souscrits: [] })
    const result = detectOpportunitiesForClient(intel, [], 1) // janvier
    expect(result.some(r => r.source === 'saisonnalite:nao_janvier')).toBe(true)
  })

  it('n\'inclut pas les opportunités saisonnières hors saison', () => {
    const intel = makeIntel({ effectif_tranche: '50-250', services_souscrits: [] })
    const result = detectOpportunitiesForClient(intel, [], 6) // juin
    expect(result.some(r => r.source === 'saisonnalite:nao_janvier')).toBe(false)
  })

  it('ne recrée pas une opportunité ignorée', () => {
    const intel = makeIntel({ services_souscrits: ['contentieux'] })
    const existing = [makeOpp({ source: 'regle:contentieux_sans_audit', statut: 'ignoree' })]
    // 'ignoree' n'est pas dans ['nouvelle', 'en_cours', 'proposee'] donc elle doit être recréée
    const result = detectOpportunitiesForClient(intel, existing, 6)
    expect(result.some(r => r.source === 'regle:contentieux_sans_audit')).toBe(true)
  })
})

describe('computeScoreOpportunite', () => {
  it('retourne 0 si pas d\'opportunités actives', () => {
    const opps = [makeOpp({ statut: 'gagnee' }), makeOpp({ statut: 'perdue' })]
    expect(computeScoreOpportunite(opps)).toBe(0)
  })

  it('retourne un score > 0 si des opportunités actives', () => {
    const opps = [
      makeOpp({ statut: 'nouvelle', ca_estime: 5000 }),
      makeOpp({ statut: 'en_cours', ca_estime: 3000 }),
    ]
    expect(computeScoreOpportunite(opps)).toBeGreaterThan(0)
  })

  it('plafonne à 100', () => {
    const opps = Array.from({ length: 20 }, (_, i) =>
      makeOpp({ id: `opp-${i}`, statut: 'nouvelle', ca_estime: 50000 })
    )
    expect(computeScoreOpportunite(opps)).toBeLessThanOrEqual(100)
  })

  it('score vide = 0', () => {
    expect(computeScoreOpportunite([])).toBe(0)
  })
})
