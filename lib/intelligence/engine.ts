import type { ClientIntelligence, OpportuniteIA, OpportuniteType } from '@/lib/types'

export type ServiceKey =
  | 'audit_rh'
  | 'formation'
  | 'rgpd'
  | 'contentieux'
  | 'conseil'
  | 'conformite'
  | 'contrats'
  | 'securite'
  | 'nao'
  | 'bilan_social'
  | 'autre'

export interface ServiceConfig {
  label: string
  description: string
  tarif_min: number
  tarif_max: number
}

export const SERVICES: Record<ServiceKey, ServiceConfig> = {
  audit_rh: { label: 'Audit RH préventif', description: 'Audit des pratiques RH et identification des risques', tarif_min: 3000, tarif_max: 8000 },
  formation: { label: 'Formation & accompagnement', description: 'Formation managers, entretiens professionnels, obligations légales', tarif_min: 1800, tarif_max: 5000 },
  rgpd: { label: 'Audit RGPD', description: 'Mise en conformité RGPD et accompagnement DPO', tarif_min: 2000, tarif_max: 6000 },
  contentieux: { label: 'Gestion contentieux', description: 'Représentation prud\'homale et contentieux sociaux', tarif_min: 2500, tarif_max: 15000 },
  conseil: { label: 'Conseil juridique', description: 'Accompagnement juridique continu et conseils RH', tarif_min: 1500, tarif_max: 5000 },
  conformite: { label: 'Conformité sociale', description: 'Audit conformité sociale et mise à niveau', tarif_min: 2000, tarif_max: 7000 },
  contrats: { label: 'Sécurisation contrats', description: 'Rédaction et sécurisation des contrats de travail', tarif_min: 1200, tarif_max: 4000 },
  securite: { label: 'Sécurité au travail', description: 'Accompagnement DUERP et obligations sécurité', tarif_min: 2000, tarif_max: 5000 },
  nao: { label: 'Accompagnement NAO', description: 'Négociations annuelles obligatoires assistées', tarif_min: 2500, tarif_max: 8000 },
  bilan_social: { label: 'Bilan social annuel', description: 'Bilan juridique et prévisionnel social annuel', tarif_min: 2000, tarif_max: 5000 },
  autre: { label: 'Autre prestation', description: 'Prestation sur mesure', tarif_min: 1000, tarif_max: 5000 },
}

export interface RegleDetection {
  id: string
  type: OpportuniteType
  source: string
  evaluer: (intel: ClientIntelligence) => boolean
  generer: (intel: ClientIntelligence) => {
    titre: string
    description: string
    service_propose: ServiceKey
    ca_estime: number
  }
}

// Règles "services manquants"
export const REGLES_SERVICES_MANQUANTS: RegleDetection[] = [
  {
    id: 'contentieux_sans_audit',
    type: 'service_manquant',
    source: 'regle:contentieux_sans_audit',
    evaluer: (intel) =>
      intel.services_souscrits.includes('contentieux') &&
      !intel.services_souscrits.includes('audit_rh'),
    generer: (intel) => ({
      titre: 'Audit RH préventif recommandé',
      description: `Votre client (${intel.secteur || 'secteur non renseigné'}) a des contentieux actifs mais n'a pas souscrit à un audit de ses pratiques RH. Un audit préventif permettrait d'identifier et corriger les risques avant qu'ils ne deviennent des litiges coûteux.`,
      service_propose: 'audit_rh',
      ca_estime: intel.effectif_tranche === '250+' ? 8000 : intel.effectif_tranche === '50-250' ? 5000 : 3500,
    }),
  },
  {
    id: 'formation_manquante',
    type: 'service_manquant',
    source: 'regle:formation_manquante',
    evaluer: (intel) =>
      ['50-250', '250+'].includes(intel.effectif_tranche) &&
      !intel.services_souscrits.includes('formation'),
    generer: (intel) => ({
      titre: 'Plan de formation managers absent',
      description: `Avec ${intel.effectif_tranche} salariés, votre client est soumis aux obligations de formation et aux entretiens professionnels biannuels. Aucune formation n'est référencée dans son profil — risque de pénalité.`,
      service_propose: 'formation',
      ca_estime: intel.effectif_tranche === '250+' ? 5000 : 3000,
    }),
  },
  {
    id: 'rgpd_absent',
    type: 'service_manquant',
    source: 'regle:rgpd_absent',
    evaluer: (intel) => {
      const secteursRgpd = ['tech', 'numérique', 'santé', 'médical', 'assurance', 'finance', 'pharmacie']
      const secteurLower = (intel.secteur || '').toLowerCase()
      const estSecteurSensible = secteursRgpd.some(s => secteurLower.includes(s))
      return estSecteurSensible && !intel.services_souscrits.includes('rgpd')
    },
    generer: (intel) => ({
      titre: 'Audit RGPD absent — données sensibles',
      description: `Le secteur "${intel.secteur}" traite des données sensibles. Sans accompagnement RGPD, votre client s'expose à des sanctions CNIL pouvant atteindre 4% du CA mondial ou 20M€.`,
      service_propose: 'rgpd',
      ca_estime: 3500,
    }),
  },
  {
    id: 'cdd_sans_conseil',
    type: 'service_manquant',
    source: 'regle:cdd_sans_conseil',
    evaluer: (intel) => {
      const secteursPrecarite = ['hôtellerie', 'restauration', 'commerce', 'distribution', 'agriculture', 'transport']
      const secteurLower = (intel.secteur || '').toLowerCase()
      return secteursPrecarite.some(s => secteurLower.includes(s)) &&
        !intel.services_souscrits.includes('contrats') &&
        !intel.services_souscrits.includes('conseil')
    },
    generer: (intel) => ({
      titre: 'Sécurisation des CDD recommandée',
      description: `Le secteur "${intel.secteur}" recourt fréquemment aux CDD et contrats précaires. Sans accompagnement juridique, chaque requalification en CDI représente un risque financier significatif.`,
      service_propose: 'contrats',
      ca_estime: 2500,
    }),
  },
]

// Règles saisonnières (mois 1-12)
export interface RegleSaisonniere {
  id: string
  source: string
  mois: number[]
  evaluer: (intel: ClientIntelligence) => boolean
  generer: (intel: ClientIntelligence) => {
    titre: string
    description: string
    service_propose: ServiceKey
    ca_estime: number
  }
}

export const REGLES_SAISONNIERES: RegleSaisonniere[] = [
  {
    id: 'nao_janvier',
    source: 'saisonnalite:nao_janvier',
    mois: [1, 2],
    evaluer: (intel) =>
      ['50-250', '250+'].includes(intel.effectif_tranche) &&
      !intel.services_souscrits.includes('nao'),
    generer: (intel) => ({
      titre: 'Accompagnement NAO 2026',
      description: `La période de négociations annuelles obligatoires (NAO) débute en janvier. Avec ${intel.effectif_tranche} salariés, votre client a l'obligation légale d'ouvrir ces négociations. Un accompagnement par un avocat spécialisé réduit les risques de conflits collectifs.`,
      service_propose: 'nao',
      ca_estime: intel.effectif_tranche === '250+' ? 6500 : 3200,
    }),
  },
  {
    id: 'entretiens_mars',
    source: 'saisonnalite:entretiens_mars',
    mois: [2, 3, 4],
    evaluer: (intel) =>
      ['11-50', '50-250', '250+'].includes(intel.effectif_tranche) &&
      !intel.services_souscrits.includes('formation'),
    generer: (intel) => ({
      titre: 'Entretiens professionnels annuels',
      description: `La période de mars est dédiée aux entretiens professionnels. Votre client n'a pas de process formalisé — risque de contentieux si les entretiens biannuels ne sont pas documentés.`,
      service_propose: 'formation',
      ca_estime: 2500,
    }),
  },
  {
    id: 'rentree_sociale',
    source: 'saisonnalite:rentree_sociale',
    mois: [8, 9],
    evaluer: (intel) =>
      ['50-250', '250+'].includes(intel.effectif_tranche),
    generer: (intel) => ({
      titre: 'Audit social de rentrée',
      description: `La rentrée de septembre est le moment idéal pour un bilan social : contrats, temps de travail, accords collectifs. Avec ${intel.effectif_tranche} salariés, votre client a de nombreuses obligations à vérifier.`,
      service_propose: 'audit_rh',
      ca_estime: intel.effectif_tranche === '250+' ? 6000 : 4000,
    }),
  },
  {
    id: 'bilan_annuel',
    source: 'saisonnalite:bilan_annuel',
    mois: [11, 12],
    evaluer: (_intel) => true,
    generer: (_intel) => ({
      titre: 'Bilan social annuel + prévisionnel juridique',
      description: `En fin d'année, un bilan social complet et un prévisionnel des risques juridiques permet d'anticiper sereinement l'année suivante. Idéal pour planifier les actions 2027.`,
      service_propose: 'bilan_social',
      ca_estime: 3500,
    }),
  },
]

export function detectOpportunitiesForClient(
  intel: ClientIntelligence,
  existingOpportunites: OpportuniteIA[],
  currentMonth?: number
): Array<{
  type: OpportuniteType
  source: string
  titre: string
  description: string
  service_propose: string
  ca_estime: number
}> {
  const month = currentMonth ?? new Date().getMonth() + 1
  const results = []

  const activeSources = new Set(
    existingOpportunites
      .filter(o => ['nouvelle', 'en_cours', 'proposee'].includes(o.statut))
      .map(o => o.source)
  )

  // Règles services manquants
  for (const regle of REGLES_SERVICES_MANQUANTS) {
    if (activeSources.has(regle.source)) continue
    if (regle.evaluer(intel)) {
      results.push({
        type: regle.type,
        source: regle.source,
        ...regle.generer(intel),
      })
    }
  }

  // Règles saisonnières
  for (const regle of REGLES_SAISONNIERES) {
    if (!regle.mois.includes(month)) continue
    if (activeSources.has(regle.source)) continue
    if (regle.evaluer(intel)) {
      results.push({
        type: 'saisonnalite' as OpportuniteType,
        source: regle.source,
        ...regle.generer(intel),
      })
    }
  }

  return results
}

export function computeScoreOpportunite(
  opportunites: OpportuniteIA[]
): number {
  const actives = opportunites.filter(o =>
    ['nouvelle', 'en_cours', 'proposee'].includes(o.statut)
  )
  if (actives.length === 0) return 0

  const totalCa = actives.reduce((sum, o) => sum + o.ca_estime, 0)
  const scoreCa = Math.min(50, Math.round(totalCa / 500))
  const scoreCount = Math.min(50, actives.length * 8)
  return Math.min(100, scoreCa + scoreCount)
}

export function getServiceLabel(key: string): string {
  return SERVICES[key as ServiceKey]?.label ?? key
}

export function getEffectifLabel(tranche: string): string {
  const labels: Record<string, string> = {
    '-11': 'Moins de 11 salariés',
    '11-50': '11 à 50 salariés',
    '50-250': '50 à 250 salariés',
    '250+': 'Plus de 250 salariés',
  }
  return labels[tranche] ?? tranche
}
