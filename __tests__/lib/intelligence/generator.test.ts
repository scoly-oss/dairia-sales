import { generateEmail, generateProposition } from '@/lib/intelligence/generator'
import type { ClientIntelligence, OpportuniteIA, ActuImpact } from '@/lib/types'

function makeClient(overrides: Partial<ClientIntelligence> = {}): ClientIntelligence {
  return {
    id: 'ci-test',
    organisation_id: null,
    contact_id: null,
    organisation_nom: 'Cabinet Martin',
    secteur: 'btp',
    code_naf: '4120A',
    idcc: '1597',
    idcc_libelle: 'CCN Travaux publics',
    effectif_tranche: '50-250',
    services_souscrits: ['contentieux'],
    score_opportunite: 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

function makeOpp(overrides: Partial<OpportuniteIA> = {}): OpportuniteIA {
  return {
    id: 'opp-test',
    client_intelligence_id: 'ci-test',
    organisation_id: null,
    organisation_nom: 'Cabinet Martin',
    type: 'services_manquants',
    source: 'rule_contentieux_audit',
    titre: 'Audit préventif RH — Cabinet Martin',
    description: 'Cabinet Martin a des contentieux sans audit RH.',
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

function makeActu(): ActuImpact {
  return {
    id: 'actu-test',
    source_type: 'jurisprudence',
    source_ref: 'Cass. soc. 12 février 2026, n°24-11.234',
    titre: 'Élargissement définition harcèlement moral',
    resume: 'La Cour de cassation étend la notion de harcèlement moral.',
    clients_concernes_ids: ['ci-test'],
    services_concernes: ['formation_managers'],
    created_at: new Date().toISOString(),
  }
}

// ============================================================
// generateEmail
// ============================================================
describe('generateEmail', () => {
  it('retourne un sujet et un corps non vides', () => {
    const { sujet, corps } = generateEmail(makeClient(), makeOpp())
    expect(sujet).toBeTruthy()
    expect(corps).toBeTruthy()
  })

  it('inclut le nom de l\'organisation dans le sujet', () => {
    const { sujet } = generateEmail(makeClient(), makeOpp())
    expect(sujet).toContain('Cabinet Martin')
  })

  it('inclut le nom de l\'organisation dans le corps', () => {
    const { corps } = generateEmail(makeClient(), makeOpp())
    expect(corps).toContain('Cabinet Martin')
  })

  it('mentionne DAIRIA Avocats dans le corps', () => {
    const { corps } = generateEmail(makeClient(), makeOpp())
    expect(corps).toContain('DAIRIA')
  })

  it('adapte le contexte pour actu_juridique avec référence actu', () => {
    const opp = makeOpp({ type: 'actu_juridique', actu_id: 'actu-test' })
    const actu = makeActu()
    const { corps } = generateEmail(makeClient(), opp, actu)
    expect(corps).toContain('Cass. soc.')
  })

  it('adapte le contexte pour saisonnalite', () => {
    const opp = makeOpp({ type: 'saisonnalite' })
    const { corps } = generateEmail(makeClient(), opp)
    expect(corps).toContain('période')
  })

  it('mentionne le secteur dans le corps', () => {
    const { corps } = generateEmail(makeClient({ secteur: 'pharma' }), makeOpp())
    expect(corps).toContain('pharma')
  })

  it('mentionne le service proposé dans le corps', () => {
    const { corps } = generateEmail(makeClient(), makeOpp({ service_propose: 'audit_rh' }))
    expect(corps).toContain('Audit des pratiques RH')
  })

  it('gère un client sans secteur', () => {
    const client = makeClient({ secteur: null })
    const { sujet, corps } = generateEmail(client, makeOpp())
    expect(sujet).toBeTruthy()
    expect(corps).toBeTruthy()
  })
})

// ============================================================
// generateProposition
// ============================================================
describe('generateProposition', () => {
  it('retourne un titre non vide', () => {
    const { titre } = generateProposition(makeClient(), makeOpp())
    expect(titre).toBeTruthy()
  })

  it('retourne des livrables non vides', () => {
    const { livrables } = generateProposition(makeClient(), makeOpp())
    expect(livrables.length).toBeGreaterThan(0)
  })

  it('calcule correctement la TVA (20%)', () => {
    const opp = makeOpp({ ca_estime: 4000 })
    const { budget_ht, tva, budget_ttc } = generateProposition(makeClient(), opp)
    expect(budget_ht).toBe(4000)
    expect(tva).toBe(800)
    expect(budget_ttc).toBe(4800)
  })

  it('calcule correctement budget_ttc = ht + tva', () => {
    const { budget_ht, tva, budget_ttc } = generateProposition(makeClient(), makeOpp())
    expect(budget_ttc).toBe(budget_ht + tva)
  })

  it('utilise le ca_estime de l\'opportunité pour budget_ht', () => {
    const opp = makeOpp({ ca_estime: 5000 })
    const { budget_ht } = generateProposition(makeClient(), opp)
    expect(budget_ht).toBe(5000)
  })

  it('inclut une date de validité', () => {
    const { validite } = generateProposition(makeClient(), makeOpp())
    expect(validite).toBeTruthy()
    expect(typeof validite).toBe('string')
  })

  it('inclut un calendrier d\'intervention', () => {
    const { calendrier } = generateProposition(makeClient(), makeOpp())
    expect(calendrier).toBeTruthy()
  })

  it('inclut des conditions de règlement', () => {
    const { conditions } = generateProposition(makeClient(), makeOpp())
    expect(conditions).toContain('30%')
  })

  it('gère tous les services connus', () => {
    const services = ['audit_rh', 'formation_managers', 'audit_rgpd', 'securisation_contrats', 'accompagnement_nao', 'entretiens_pro', 'bilan_social', 'previsionnel_juridique', 'conseil_disciplinaire', 'information_collective']
    services.forEach((service) => {
      const opp = makeOpp({ service_propose: service, ca_estime: 3000 })
      const { livrables } = generateProposition(makeClient(), opp)
      expect(livrables.length).toBeGreaterThan(0)
    })
  })

  it('gère un service inconnu avec un fallback', () => {
    const opp = makeOpp({ service_propose: 'service_inexistant', ca_estime: 2500 })
    const { livrables, budget_ht } = generateProposition(makeClient(), opp)
    expect(livrables.length).toBeGreaterThan(0)
    expect(budget_ht).toBe(2500)
  })
})
