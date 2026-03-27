import type {
  ClientIntelligence,
  OpportuniteIA,
  ActuImpact,
  ServiceIntelligence,
  OpportuniteSource,
} from '@/lib/types'

// ---------------------------------------------------------------------------
// Types internes au moteur
// ---------------------------------------------------------------------------

export interface OpportuniteCandidate {
  type: OpportuniteSource
  source: string
  titre: string
  description: string
  service_propose: ServiceIntelligence
  ca_estime: number
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

export function effectifLabel(tranche: string | null): string {
  switch (tranche) {
    case 'moins_11': return 'Moins de 11 salariés'
    case '11_50': return '11 à 50 salariés'
    case '50_250': return '50 à 250 salariés'
    case '250_plus': return 'Plus de 250 salariés'
    default: return 'Effectif non renseigné'
  }
}

export function serviceLabel(service: ServiceIntelligence): string {
  const labels: Record<ServiceIntelligence, string> = {
    audit_rh: 'Audit préventif RH',
    formation_managers: 'Formation managers',
    audit_rgpd: 'Audit RGPD',
    conseil_contrats: 'Conseil & sécurisation contrats',
    nao: 'Accompagnement NAO',
    bilan_social: 'Bilan social',
    entretiens_pro: 'Entretiens professionnels',
    rentree_sociale: 'Audit social de rentrée',
    info_collective: 'Information collective',
    securisation_contrats: 'Sécurisation contrats CDD/freelance',
    contentieux: 'Contentieux',
  }
  return labels[service] ?? service
}

export function sourceTypeLabel(type: string): string {
  switch (type) {
    case 'decret': return 'Décret'
    case 'jurisprudence': return 'Jurisprudence'
    case 'reforme': return 'Réforme législative'
    case 'ccn': return 'Convention collective'
    default: return 'Actualité juridique'
  }
}

export function opportuniteStatutLabel(statut: string): string {
  switch (statut) {
    case 'detectee': return 'Détectée'
    case 'en_cours': return 'En cours'
    case 'envoyee': return 'Envoyée'
    case 'convertie': return 'Convertie'
    case 'ignoree': return 'Ignorée'
    default: return statut
  }
}

export function opportuniteStatutColor(statut: string): string {
  switch (statut) {
    case 'detectee': return '#e8842c'
    case 'en_cours': return '#2a3f54'
    case 'envoyee': return '#6366f1'
    case 'convertie': return '#22c55e'
    case 'ignoree': return '#9ca3af'
    default: return '#6b7280'
  }
}

// ---------------------------------------------------------------------------
// Règles de détection
// ---------------------------------------------------------------------------

type Regle = (
  ci: ClientIntelligence,
  opportunitesExistantes: OpportuniteIA[]
) => OpportuniteCandidate | null

// Vérifie qu'une opportunité active du même type/service n'existe pas déjà
function dejaDetectee(
  opportunitesExistantes: OpportuniteIA[],
  service: ServiceIntelligence
): boolean {
  return opportunitesExistantes.some(
    (o) =>
      o.service_propose === service &&
      !['ignoree', 'convertie'].includes(o.statut)
  )
}

// Règle 1 : contentieux sans audit RH
const regleContentieuxSansAudit: Regle = (ci, existantes) => {
  const aContentieux = ci.services_souscrits.includes('contentieux')
  const aAuditRh = ci.services_souscrits.includes('audit_rh')
  if (!aContentieux || aAuditRh) return null
  if (dejaDetectee(existantes, 'audit_rh')) return null

  return {
    type: 'service_manquant',
    source: 'regle_contentieux_sans_audit',
    titre: 'Audit préventif RH recommandé',
    description: `${ci.prospect?.company_name ?? 'Ce client'} a des dossiers contentieux actifs mais n'a pas encore réalisé d'audit préventif des pratiques RH. Un audit permettrait d'identifier et corriger les risques avant qu'ils ne génèrent de nouveaux litiges.`,
    service_propose: 'audit_rh',
    ca_estime: 4500,
  }
}

// Règle 2 : 50+ salariés sans formation managers
const regleEffectifFormation: Regle = (ci, existantes) => {
  const effectifSuffisant = ['50_250', '250_plus'].includes(ci.effectif_tranche ?? '')
  const aFormation = ci.services_souscrits.includes('formation_managers')
  if (!effectifSuffisant || aFormation) return null
  if (dejaDetectee(existantes, 'formation_managers')) return null

  return {
    type: 'service_manquant',
    source: 'regle_effectif_formation',
    titre: `Formation managers — obligation légale (${effectifLabel(ci.effectif_tranche)})`,
    description: `Avec ${effectifLabel(ci.effectif_tranche)}, ${ci.prospect?.company_name ?? 'ce client'} est soumis à l'obligation de formation des encadrants sur la conduite des entretiens professionnels et la gestion des risques RH.`,
    service_propose: 'formation_managers',
    ca_estime: 3200,
  }
}

// Règle 3 : pas de RGPD (secteurs tech/santé/pharma à risque)
const SECTEURS_RGPD_CRITIQUES = [
  'Technologies & Numérique',
  'Santé & Médico-social',
  'Industrie Pharmaceutique',
  'Services aux entreprises',
  'Commerce & Distribution',
]
const regleRgpd: Regle = (ci, existantes) => {
  const secteurSensible = SECTEURS_RGPD_CRITIQUES.some((s) =>
    ci.secteur?.toLowerCase().includes(s.toLowerCase().split(' ')[0].toLowerCase())
  )
  const aRgpd = ci.services_souscrits.includes('audit_rgpd')
  if (!secteurSensible || aRgpd) return null
  if (dejaDetectee(existantes, 'audit_rgpd')) return null

  return {
    type: 'service_manquant',
    source: 'regle_rgpd',
    titre: 'Audit RGPD prioritaire',
    description: `Le secteur ${ci.secteur} traite des données personnelles sensibles. L'absence d'audit RGPD expose ${ci.prospect?.company_name ?? 'ce client'} à des sanctions CNIL pouvant atteindre 4% du CA mondial.`,
    service_propose: 'audit_rgpd',
    ca_estime: 3500,
  }
}

// Règle 4 : CDD nombreux → sécurisation contrats (heuristique : secteurs à fort turnover)
const SECTEURS_CDD = [
  'Transport',
  'Commerce',
  'Technologies',
  'Éducation',
  'Santé',
]
const regleCdd: Regle = (ci, existantes) => {
  const secteurCdd = SECTEURS_CDD.some((s) =>
    ci.secteur?.toLowerCase().includes(s.toLowerCase())
  )
  const aConseil = ci.services_souscrits.includes('securisation_contrats')
  if (!secteurCdd || aConseil) return null
  if (dejaDetectee(existantes, 'securisation_contrats')) return null

  return {
    type: 'service_manquant',
    source: 'regle_cdd',
    titre: 'Sécurisation des contrats précaires',
    description: `Le secteur ${ci.secteur} fait usage fréquent de contrats à durée déterminée et de freelances. ${ci.prospect?.company_name ?? 'Ce client'} s'expose à un risque de requalification sans révision contractuelle.`,
    service_propose: 'securisation_contrats',
    ca_estime: 2200,
  }
}

// Règle saisonnière : NAO (janvier)
const regleNao: Regle = (ci, existantes) => {
  const mois = new Date().getMonth() + 1
  if (mois !== 1) return null
  const effectifSuffisant = ['11_50', '50_250', '250_plus'].includes(ci.effectif_tranche ?? '')
  if (!effectifSuffisant) return null
  if (dejaDetectee(existantes, 'nao')) return null

  return {
    type: 'saisonnalite',
    source: 'nao_janvier',
    titre: 'Accompagnement NAO — Négociations annuelles obligatoires',
    description: `Janvier : les NAO doivent être ouvertes. DAIRIA peut accompagner ${ci.prospect?.company_name ?? 'ce client'} dans la préparation, la stratégie et la conduite des négociations avec les délégués syndicaux.`,
    service_propose: 'nao',
    ca_estime: 4800,
  }
}

// Règle saisonnière : entretiens professionnels (mars)
const regleEntretiensMars: Regle = (ci, existantes) => {
  const mois = new Date().getMonth() + 1
  if (mois !== 3) return null
  const effectifSuffisant = ['11_50', '50_250', '250_plus'].includes(ci.effectif_tranche ?? '')
  if (!effectifSuffisant) return null
  if (dejaDetectee(existantes, 'entretiens_pro')) return null

  return {
    type: 'saisonnalite',
    source: 'entretiens_mars',
    titre: 'Campagne entretiens professionnels 2026',
    description: `Mars est la période idéale pour lancer la campagne d'entretiens professionnels obligatoires. ${ci.prospect?.company_name ?? 'Ce client'} doit s'assurer de la conformité de ses entretiens sous peine d'abondement CPF.`,
    service_propose: 'entretiens_pro',
    ca_estime: Math.max(1800, (ci.effectif_tranche === '250_plus' ? 6500 : 3200)),
  }
}

// Règle saisonnière : rentrée sociale (septembre)
const regleRentreeSociale: Regle = (ci, existantes) => {
  const mois = new Date().getMonth() + 1
  if (mois !== 9) return null
  if (dejaDetectee(existantes, 'rentree_sociale')) return null

  return {
    type: 'saisonnalite',
    source: 'rentree_sociale',
    titre: 'Audit social de rentrée',
    description: `La rentrée sociale est le moment idéal pour un audit complet de la conformité sociale de ${ci.prospect?.company_name ?? 'ce client'} : contrats, accords, BDES, obligations périodiques.`,
    service_propose: 'rentree_sociale',
    ca_estime: 4200,
  }
}

// Règle saisonnière : bilan annuel (décembre)
const regleBilanDecembre: Regle = (ci, existantes) => {
  const mois = new Date().getMonth() + 1
  if (mois !== 12) return null
  if (dejaDetectee(existantes, 'bilan_social')) return null

  return {
    type: 'saisonnalite',
    source: 'bilan_decembre',
    titre: 'Bilan social + prévisionnel juridique',
    description: `Décembre : heure du bilan social annuel et de la planification juridique. DAIRIA peut accompagner ${ci.prospect?.company_name ?? 'ce client'} dans la préparation du bilan et l'anticipation des enjeux RH de l'année suivante.`,
    service_propose: 'bilan_social',
    ca_estime: 3800,
  }
}

const TOUTES_LES_REGLES: Regle[] = [
  regleContentieuxSansAudit,
  regleEffectifFormation,
  regleRgpd,
  regleCdd,
  regleNao,
  regleEntretiensMars,
  regleRentreeSociale,
  regleBilanDecembre,
]

// ---------------------------------------------------------------------------
// Moteur principal
// ---------------------------------------------------------------------------

/**
 * Détecte les opportunités pour un client donné.
 * Retourne les opportunités candidates (pas encore persistées).
 */
export function detecterOpportunites(
  ci: ClientIntelligence,
  opportunitesExistantes: OpportuniteIA[]
): OpportuniteCandidate[] {
  const candidats: OpportuniteCandidate[] = []
  for (const regle of TOUTES_LES_REGLES) {
    const resultat = regle(ci, opportunitesExistantes)
    if (resultat) {
      candidats.push(resultat)
    }
  }
  return candidats
}

/**
 * Détecte les clients concernés par une actualité juridique.
 */
export function detecterClientsActu(
  actu: ActuImpact,
  clients: ClientIntelligence[]
): ClientIntelligence[] {
  // Les clients concernés sont ceux dont l'ID figure dans clients_concernes_ids
  return clients.filter((ci) =>
    actu.clients_concernes_ids.includes(ci.prospect_id)
  )
}

/**
 * Calcule le score d'opportunité d'un client (0-100).
 * Basé sur :
 * - Nombre d'opportunités actives (detectee ou en_cours)
 * - CA potentiel estimé
 * - Saisonalité
 */
export function calculerScore(
  ci: ClientIntelligence,
  opportunites: OpportuniteIA[]
): number {
  const actives = opportunites.filter((o) =>
    ['detectee', 'en_cours'].includes(o.statut)
  )
  const caPotentiel = actives.reduce((sum, o) => sum + (o.ca_estime ?? 0), 0)

  // Score basé sur CA potentiel (max ~15k€ → 60 pts) + nombre d'opportunités (max 5 → 40 pts)
  const scoreCA = Math.min(60, Math.round((caPotentiel / 15000) * 60))
  const scoreNombre = Math.min(40, actives.length * 8)

  return Math.min(100, scoreCA + scoreNombre)
}
