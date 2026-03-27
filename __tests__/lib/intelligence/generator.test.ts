import { genererEmail, genererProposition } from '@/lib/intelligence/generator'
import type { ClientIntelligence, OpportuniteIA } from '@/lib/types'

const baseCi = (): ClientIntelligence => ({
  id: 'ci-1',
  prospect_id: 'p-1',
  secteur: 'Transport & Logistique',
  code_naf: '4941A',
  idcc: '16',
  effectif_tranche: '50_250',
  services_souscrits: ['contentieux'],
  score_opportunite: 60,
  updated_at: new Date().toISOString(),
  prospect: {
    id: 'p-1',
    company_name: 'Transport Dupont SARL',
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

const baseOpp = (service: OpportuniteIA['service_propose'] = 'audit_rh'): OpportuniteIA => ({
  id: 'opp-1',
  prospect_id: 'p-1',
  type: 'service_manquant',
  source: 'regle_contentieux_sans_audit',
  titre: 'Audit préventif RH recommandé',
  description: 'Ce client a des contentieux actifs sans audit préventif.',
  service_propose: service,
  ca_estime: 4500,
  statut: 'detectee',
  email_genere: null,
  proposition_generee: null,
  created_at: new Date().toISOString(),
})

// ---------------------------------------------------------------------------
// genererEmail
// ---------------------------------------------------------------------------

describe('genererEmail', () => {
  it('retourne un objet avec sujet et corps', () => {
    const result = genererEmail(baseCi(), baseOpp())
    expect(result).toHaveProperty('sujet')
    expect(result).toHaveProperty('corps')
  })

  it('inclut le nom de l\'entreprise dans le sujet', () => {
    const result = genererEmail(baseCi(), baseOpp())
    expect(result.sujet).toContain('Transport Dupont SARL')
  })

  it('inclut le nom de l\'entreprise dans le corps', () => {
    const result = genererEmail(baseCi(), baseOpp())
    expect(result.corps).toContain('Transport Dupont SARL')
  })

  it('inclut le secteur dans le corps', () => {
    const result = genererEmail(baseCi(), baseOpp())
    expect(result.corps).toContain('Transport')
  })

  it('inclut l\'argument d\'urgence dans le corps', () => {
    const result = genererEmail(baseCi(), baseOpp())
    expect(result.corps).toContain('Pourquoi agir maintenant')
  })

  it('inclut le risque en cas d\'inaction', () => {
    const result = genererEmail(baseCi(), baseOpp())
    expect(result.corps).toContain("Risque en cas d'inaction")
  })

  it('fonctionne pour tous les services', () => {
    const services: OpportuniteIA['service_propose'][] = [
      'audit_rh',
      'formation_managers',
      'audit_rgpd',
      'conseil_contrats',
      'nao',
      'bilan_social',
      'entretiens_pro',
      'rentree_sociale',
      'info_collective',
      'securisation_contrats',
    ]
    for (const service of services) {
      const result = genererEmail(baseCi(), baseOpp(service))
      expect(result.sujet).toBeTruthy()
      expect(result.corps).toBeTruthy()
    }
  })

  it('gère une opportunité de type actu_juridique', () => {
    const opp = { ...baseOpp(), type: 'actu_juridique' as const, source: 'cass_soc_test' }
    const result = genererEmail(baseCi(), opp)
    expect(result.corps).toBeTruthy()
  })

  it('gère une opportunité saisonnière', () => {
    const opp = { ...baseOpp(), type: 'saisonnalite' as const, source: 'nao_janvier' }
    const result = genererEmail(baseCi(), opp)
    expect(result.corps).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// genererProposition
// ---------------------------------------------------------------------------

describe('genererProposition', () => {
  it('retourne une proposition avec tous les champs requis', () => {
    const result = genererProposition(baseCi(), baseOpp())
    expect(result).toHaveProperty('titre')
    expect(result).toHaveProperty('contexte')
    expect(result).toHaveProperty('livrables')
    expect(result).toHaveProperty('calendrier')
    expect(result).toHaveProperty('budget_ht')
    expect(result).toHaveProperty('budget_tva')
    expect(result).toHaveProperty('budget_ttc')
    expect(result).toHaveProperty('conditions')
  })

  it('inclut le nom de l\'entreprise dans le titre', () => {
    const result = genererProposition(baseCi(), baseOpp())
    expect(result.titre).toContain('Transport Dupont SARL')
  })

  it('calcule correctement la TVA (20%)', () => {
    const result = genererProposition(baseCi(), baseOpp())
    expect(result.budget_tva).toBe(Math.round(result.budget_ht * 0.2))
  })

  it('calcule correctement le TTC', () => {
    const result = genererProposition(baseCi(), baseOpp())
    expect(result.budget_ttc).toBe(result.budget_ht + result.budget_tva)
  })

  it('retourne au moins un livrable', () => {
    const result = genererProposition(baseCi(), baseOpp())
    expect(result.livrables.length).toBeGreaterThan(0)
  })

  it('utilise le ca_estime de l\'opportunité comme budget_ht', () => {
    const opp = { ...baseOpp(), ca_estime: 6000 }
    const result = genererProposition(baseCi(), opp)
    expect(result.budget_ht).toBe(6000)
  })

  it('fonctionne pour tous les services', () => {
    const services: OpportuniteIA['service_propose'][] = [
      'audit_rh',
      'formation_managers',
      'audit_rgpd',
      'conseil_contrats',
      'nao',
      'bilan_social',
      'entretiens_pro',
      'rentree_sociale',
      'info_collective',
      'securisation_contrats',
    ]
    for (const service of services) {
      const result = genererProposition(baseCi(), baseOpp(service))
      expect(result.titre).toBeTruthy()
      expect(result.livrables.length).toBeGreaterThan(0)
      expect(result.budget_ht).toBeGreaterThan(0)
    }
  })
})
