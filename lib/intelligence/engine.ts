import type { ClientIntelligence, OpportuniteIA, ActuImpact, OpportuniteType } from '@/lib/types'

// Catalogue des services disponibles
export const SERVICES: Record<string, string> = {
  audit_rh: 'Audit des pratiques RH',
  formation_managers: 'Formation managers',
  audit_rgpd: 'Audit RGPD',
  securisation_contrats: 'Sécurisation des contrats',
  accompagnement_nao: 'Accompagnement NAO',
  entretiens_pro: 'Entretiens professionnels',
  bilan_social: 'Bilan social',
  previsionnel_juridique: 'Prévisionnel juridique',
  conseil_disciplinaire: 'Conseil disciplinaire',
  information_collective: 'Information collective',
  audit_preventif: 'Audit préventif complet',
  contentieux: 'Contentieux',
  conseil: 'Conseil juridique',
}

export function getServiceLabel(key: string): string {
  return SERVICES[key] ?? key
}

// Secteurs sensibles au RGPD
const SECTEURS_SENSIBLES_RGPD = ['sante', 'tech', 'pharma', 'finance', 'assurance', 'banque']

// Tranches avec 50+ salariés
const TRANCHE_50_PLUS = ['50-250', '250+']

export interface DetectedOpportunite {
  type: OpportuniteType
  source: string
  titre: string
  description: string
  service_propose: string
  ca_estime: number
  actu_id?: string
}

/**
 * Vérifie si une opportunité identique (même source) est déjà active pour ce client
 */
function isDuplicate(source: string, existing: OpportuniteIA[]): boolean {
  return existing.some(
    (o) =>
      o.source === source &&
      (o.statut === 'nouvelle' || o.statut === 'en_cours')
  )
}

/**
 * Règles basées sur les services manquants
 */
function detectServicesManquants(
  client: ClientIntelligence,
  existing: OpportuniteIA[]
): DetectedOpportunite[] {
  const opps: DetectedOpportunite[] = []
  const services = client.services_souscrits

  // Contentieux actifs sans audit RH préventif
  if (
    services.includes('contentieux') &&
    !services.includes('audit_rh') &&
    !isDuplicate('rule_contentieux_audit', existing)
  ) {
    opps.push({
      type: 'services_manquants',
      source: 'rule_contentieux_audit',
      titre: `Audit préventif RH — ${client.organisation_nom}`,
      description: `${client.organisation_nom} a des dossiers contentieux actifs mais n'a jamais réalisé d'audit de ses pratiques RH. Un audit préventif permettrait de sécuriser les pratiques et de réduire significativement les risques futurs.`,
      service_propose: 'audit_rh',
      ca_estime: 3500,
    })
  }

  // 50+ salariés sans formation managers
  if (
    client.effectif_tranche &&
    TRANCHE_50_PLUS.includes(client.effectif_tranche) &&
    !services.includes('formation_managers') &&
    !isDuplicate('rule_50_formation', existing)
  ) {
    opps.push({
      type: 'services_manquants',
      source: 'rule_50_formation',
      titre: `Formation managers obligatoire — ${client.organisation_nom}`,
      description: `Avec ${client.effectif_tranche} salariés, ${client.organisation_nom} est soumise à des obligations légales de formation. L'absence de programme structuré pour les managers expose à des risques de conflits internes et de contentieux managériaux.`,
      service_propose: 'formation_managers',
      ca_estime: 3000,
    })
  }

  // Secteur sensible sans audit RGPD
  if (
    client.secteur &&
    SECTEURS_SENSIBLES_RGPD.includes(client.secteur) &&
    !services.includes('audit_rgpd') &&
    !isDuplicate('rule_rgpd', existing)
  ) {
    opps.push({
      type: 'services_manquants',
      source: 'rule_rgpd',
      titre: `Audit RGPD prioritaire — ${client.organisation_nom}`,
      description: `Le secteur ${client.secteur} traite des données sensibles. ${client.organisation_nom} n'a pas de couverture RGPD formalisée. La CNIL a renforcé ses contrôles — le risque de sanction est jusqu'à 4% du chiffre d'affaires.`,
      service_propose: 'audit_rgpd',
      ca_estime: 4500,
    })
  }

  // CDD nombreux sans sécurisation des contrats
  if (
    services.includes('cdd_nombreux') &&
    !services.includes('securisation_contrats') &&
    !isDuplicate('rule_cdd_securisation', existing)
  ) {
    opps.push({
      type: 'services_manquants',
      source: 'rule_cdd_securisation',
      titre: `Sécurisation des contrats — CDD à risque`,
      description: `${client.organisation_nom} recourt massivement aux CDD sans bénéficier de conseil en sécurisation des contrats atypiques. Chaque requalification en CDI coûte en moyenne 15 000€.`,
      service_propose: 'securisation_contrats',
      ca_estime: 2000,
    })
  }

  return opps
}

/**
 * Règles saisonnières basées sur le mois courant
 */
function detectSaisonnalite(
  client: ClientIntelligence,
  existing: OpportuniteIA[],
  now: Date
): DetectedOpportunite[] {
  const opps: DetectedOpportunite[] = []
  const month = now.getMonth() + 1 // 1-12
  const services = client.services_souscrits

  // Janvier : NAO (négociations annuelles obligatoires)
  if (
    month === 1 &&
    !services.includes('accompagnement_nao') &&
    !isDuplicate('seasonal_january_nao', existing)
  ) {
    opps.push({
      type: 'saisonnalite',
      source: 'seasonal_january_nao',
      titre: `Accompagnement NAO — ${new Date().getFullYear()}`,
      description: `C'est le moment des NAO (Négociations Annuelles Obligatoires). ${client.organisation_nom} n'a pas encore d'accompagnement dédié. Un avocat spécialisé peut sécuriser le processus et optimiser le résultat.`,
      service_propose: 'accompagnement_nao',
      ca_estime: 5000,
    })
  }

  // Mars : entretiens professionnels (50+ salariés)
  if (
    month === 3 &&
    client.effectif_tranche &&
    TRANCHE_50_PLUS.includes(client.effectif_tranche) &&
    !services.includes('entretiens_pro') &&
    !isDuplicate('seasonal_march', existing)
  ) {
    opps.push({
      type: 'saisonnalite',
      source: 'seasonal_march',
      titre: `Entretiens professionnels obligatoires — Mars ${now.getFullYear()}`,
      description: `Mars est la période clé pour mettre en place les entretiens professionnels obligatoires. ${client.organisation_nom} (${client.effectif_tranche} salariés) doit se conformer au décret de mars 2026 sous peine de sanctions financières.`,
      service_propose: 'entretiens_pro',
      ca_estime: 2500,
    })
  }

  // Septembre : audit social de rentrée
  if (
    month === 9 &&
    !services.includes('bilan_social') &&
    !isDuplicate('seasonal_september', existing)
  ) {
    opps.push({
      type: 'saisonnalite',
      source: 'seasonal_september',
      titre: `Bilan social de rentrée — ${now.getFullYear()}`,
      description: `La rentrée de septembre est le moment idéal pour un audit social. ${client.organisation_nom} peut anticiper les risques du dernier trimestre et préparer les NAO en sécurisant ses pratiques RH.`,
      service_propose: 'bilan_social',
      ca_estime: 3000,
    })
  }

  // Décembre : prévisionnel juridique annuel
  if (
    month === 12 &&
    !services.includes('previsionnel_juridique') &&
    !isDuplicate('seasonal_december', existing)
  ) {
    opps.push({
      type: 'saisonnalite',
      source: 'seasonal_december',
      titre: `Prévisionnel juridique ${now.getFullYear() + 1}`,
      description: `Décembre est le moment de préparer ${now.getFullYear() + 1} avec un bilan juridique et un prévisionnel des risques. ${client.organisation_nom} bénéficiera d'une feuille de route claire pour l'année à venir.`,
      service_propose: 'previsionnel_juridique',
      ca_estime: 3500,
    })
  }

  return opps
}

/**
 * Règles basées sur les actualités juridiques
 */
function detectActuJuridique(
  client: ClientIntelligence,
  existing: OpportuniteIA[],
  actus: ActuImpact[]
): DetectedOpportunite[] {
  const opps: DetectedOpportunite[] = []

  for (const actu of actus) {
    if (!actu.clients_concernes_ids.includes(client.id)) continue

    const source = `actu_${actu.id}`
    if (isDuplicate(source, existing)) continue

    const service = actu.services_concernes[0] ?? 'conseil'
    opps.push({
      type: 'actu_juridique',
      source,
      titre: `Impact ${actu.titre.substring(0, 60)}… — ${client.organisation_nom}`,
      description: `${actu.resume ?? actu.titre} Cette actualité impacte directement ${client.organisation_nom} et nécessite une action rapide.`,
      service_propose: service,
      ca_estime: estimateCaByService(service),
      actu_id: actu.id,
    })
  }

  return opps
}

function estimateCaByService(service: string): number {
  const estimates: Record<string, number> = {
    audit_rh: 3500,
    formation_managers: 3000,
    audit_rgpd: 4500,
    securisation_contrats: 2000,
    accompagnement_nao: 5000,
    entretiens_pro: 2500,
    bilan_social: 3000,
    previsionnel_juridique: 3500,
    conseil_disciplinaire: 2000,
    information_collective: 5000,
    audit_preventif: 6000,
    contentieux: 4000,
    conseil: 2500,
  }
  return estimates[service] ?? 2000
}

/**
 * Détecte toutes les opportunités pour un client donné
 */
export function detectOpportunites(
  client: ClientIntelligence,
  existing: OpportuniteIA[],
  actus: ActuImpact[],
  now: Date = new Date()
): DetectedOpportunite[] {
  return [
    ...detectServicesManquants(client, existing),
    ...detectSaisonnalite(client, existing, now),
    ...detectActuJuridique(client, existing, actus),
  ]
}

/**
 * Calcule le score d'opportunité (0–100) basé sur le nombre et le CA potentiel des opportunités
 */
export function calculateScore(
  client: ClientIntelligence,
  allOpps: OpportuniteIA[],
  newOpps: DetectedOpportunite[]
): number {
  const activeOpps = allOpps.filter(
    (o) => o.client_intelligence_id === client.id && (o.statut === 'nouvelle' || o.statut === 'en_cours')
  )
  const totalOpps = activeOpps.length + newOpps.length
  const totalCa = [
    ...activeOpps.map((o) => o.ca_estime),
    ...newOpps.map((o) => o.ca_estime),
  ].reduce((a, b) => a + b, 0)

  // Score basé sur nombre d'opps (max 50 pts) + CA potentiel (max 50 pts)
  const scoreOpps = Math.min(totalOpps * 8, 50)
  const scoreCa = Math.min(Math.round(totalCa / 1000), 50)

  return Math.min(scoreOpps + scoreCa, 100)
}

/**
 * Labels lisibles pour l'UI
 */
export function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    services_manquants: 'Service manquant',
    saisonnalite: 'Opportunité saisonnière',
    actu_juridique: 'Actualité juridique',
  }
  return labels[type] ?? type
}

export function getStatutLabel(statut: string): string {
  const labels: Record<string, string> = {
    nouvelle: 'Nouvelle',
    en_cours: 'En cours',
    gagnee: 'Gagnée',
    perdue: 'Perdue',
    ignoree: 'Ignorée',
  }
  return labels[statut] ?? statut
}

export function getEffectifLabel(tranche: string | null): string {
  if (!tranche) return 'Non renseigné'
  const labels: Record<string, string> = {
    '-11': 'Moins de 11 salariés',
    '11-50': '11 à 50 salariés',
    '50-250': '50 à 250 salariés',
    '250+': 'Plus de 250 salariés',
  }
  return labels[tranche] ?? tranche
}
