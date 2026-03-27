import { generateEmail, generateProposition } from '@/lib/intelligence/generator'
import { SERVICES } from '@/lib/intelligence/engine'
import type { ClientIntelligence, OpportuniteIA } from '@/lib/types'

function makeIntel(overrides: Partial<ClientIntelligence> = {}): ClientIntelligence {
  return {
    id: 'intel-1',
    prospect_id: 'prospect-1',
    secteur: 'Transport & Logistique',
    code_naf: '4941A',
    idcc: '0016',
    idcc_libelle: 'Transports routiers',
    effectif_tranche: '50-250',
    services_souscrits: ['contentieux'],
    services_potentiels: ['audit_rh'],
    score_opportunite: 65,
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
    source: 'regle:contentieux_sans_audit',
    titre: 'Audit RH préventif recommandé',
    description: 'Client avec contentieux sans audit RH.',
    service_propose: 'audit_rh',
    ca_estime: 4500,
    statut: 'nouvelle',
    email_genere: null,
    proposition_generee: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

describe('generateEmail', () => {
  it('génère un email avec sujet non vide', () => {
    const email = generateEmail(makeIntel(), makeOpp(), 'Transports Dupont')
    expect(email.sujet).toBeTruthy()
    expect(email.sujet).toContain('Transports Dupont')
  })

  it('le corps contient le nom du client', () => {
    const email = generateEmail(makeIntel(), makeOpp(), 'Transports Dupont')
    expect(email.corps).toContain('Transports Dupont')
  })

  it('le corps contient la salutation avec contact', () => {
    const email = generateEmail(makeIntel(), makeOpp(), 'Transports Dupont', 'Dupont')
    expect(email.corps).toContain('Dupont')
  })

  it('le corps contient la salutation générique sans contact', () => {
    const email = generateEmail(makeIntel(), makeOpp(), 'Transports Dupont')
    expect(email.corps).toContain('Madame, Monsieur')
  })

  it('mentionne le secteur dans le corps', () => {
    const email = generateEmail(makeIntel(), makeOpp(), 'Transports Dupont')
    expect(email.corps).toContain('Transport & Logistique')
  })

  it('gère le type actu_juridique', () => {
    const opp = makeOpp({ type: 'actu_juridique', source: 'actu:harcelement' })
    const email = generateEmail(makeIntel(), opp, 'Client SA')
    expect(email.corps).toContain('actualité juridique')
  })

  it('gère le type saisonnalite', () => {
    const opp = makeOpp({ type: 'saisonnalite', source: 'saisonnalite:nao_janvier' })
    const email = generateEmail(makeIntel(), opp, 'Client SA')
    expect(email.corps).toContain('échéance')
  })
})

describe('generateProposition', () => {
  it('génère une proposition avec titre', () => {
    const prop = generateProposition(makeIntel(), makeOpp(), 'Transports Dupont')
    expect(prop.titre).toContain('Transports Dupont')
    expect(prop.titre).toContain('Audit RH')
  })

  it('le budget HT correspond au ca_estime', () => {
    const prop = generateProposition(makeIntel(), makeOpp(), 'Transports Dupont')
    expect(prop.budget_ht).toBe(4500)
  })

  it('la TVA est à 20%', () => {
    const prop = generateProposition(makeIntel(), makeOpp(), 'Transports Dupont')
    expect(prop.tva).toBe(900)
  })

  it('le TTC = HT + TVA', () => {
    const prop = generateProposition(makeIntel(), makeOpp(), 'Transports Dupont')
    expect(prop.budget_ttc).toBe(prop.budget_ht + prop.tva)
  })

  it('contient des livrables', () => {
    const prop = generateProposition(makeIntel(), makeOpp(), 'Transports Dupont')
    expect(prop.livrables.length).toBeGreaterThan(0)
  })

  it('contient un calendrier', () => {
    const prop = generateProposition(makeIntel(), makeOpp(), 'Transports Dupont')
    expect(prop.calendrier).toBeTruthy()
  })

  it('contient une date de validité', () => {
    const prop = generateProposition(makeIntel(), makeOpp(), 'Transports Dupont')
    expect(prop.validite).toBeTruthy()
  })

  it('génère des propositions pour chaque service', () => {
    const serviceKeys = Object.keys(SERVICES)
    for (const key of serviceKeys) {
      const opp = makeOpp({ service_propose: key, ca_estime: 3000 })
      const prop = generateProposition(makeIntel(), opp, 'Client Test')
      expect(prop.livrables.length).toBeGreaterThan(0)
      expect(prop.budget_ht).toBe(3000)
    }
  })
})
