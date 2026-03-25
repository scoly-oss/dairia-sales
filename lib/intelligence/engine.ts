import type {
  ClientIntelligence,
  OpportuniteIA,
  OpportuniteStatut,
  ActuImpact,
  Prospect,
} from '@/lib/types'

// ---------------------------------------------------------------------------
// Types internes
// ---------------------------------------------------------------------------

export interface ServiceGapRule {
  id: string
  check: (client: ClientIntelligence) => boolean
  generate: (
    client: ClientIntelligence,
    prospect: Prospect
  ) => Omit<OpportuniteIA, 'id' | 'created_at' | 'email_genere' | 'proposition_generee' | 'statut'>
}

export interface SeasonalRule {
  id: string
  months: number[]
  check: (client: ClientIntelligence) => boolean
  generate: (
    client: ClientIntelligence,
    prospect: Prospect,
    month: number
  ) => Omit<OpportuniteIA, 'id' | 'created_at' | 'email_genere' | 'proposition_generee' | 'statut'>
}

// ---------------------------------------------------------------------------
// Règles : services manquants
// ---------------------------------------------------------------------------

export const SERVICE_GAP_RULES: ServiceGapRule[] = [
  {
    id: 'contentieux_sans_audit',
    check: (c) =>
      c.services_souscrits.includes('contentieux') &&
      !c.services_souscrits.includes('audit'),
    generate: (c, p) => ({
      prospect_id: p.id,
      type: 'service_manquant',
      source: 'Contentieux actifs sans audit RH préventif',
      titre: 'Audit préventif des pratiques RH recommandé',
      description: `${p.company_name} a des contentieux prud'homaux en cours mais n'a pas réalisé d'audit préventif des pratiques RH. Un audit permettrait de réduire les risques futurs et d'optimiser la gestion sociale.`,
      service_propose: 'audit',
      ca_estime: 3500,
    }),
  },
  {
    id: 'effectif_50_sans_formation',
    check: (c) =>
      ['de_50_250', 'plus_250'].includes(c.effectif_tranche) &&
      !c.services_souscrits.includes('formation'),
    generate: (c, p) => ({
      prospect_id: p.id,
      type: 'service_manquant',
      source: 'Effectif 50+ sans formation obligatoire',
      titre: 'Formation managers obligatoire (50+ salariés)',
      description: `Avec ${c.effectif_tranche === 'de_50_250' ? '50 à 250' : 'plus de 250'} salariés, ${p.company_name} est soumis à des obligations de formation. Un programme de formation managers est recommandé et peut être financé via les OPCO.`,
      service_propose: 'formation',
      ca_estime: 4000,
    }),
  },
  {
    id: 'sans_rgpd',
    check: (c) => !c.services_souscrits.includes('conformite'),
    generate: (_c, p) => ({
      prospect_id: p.id,
      type: 'service_manquant',
      source: 'Absence de mise en conformité RGPD',
      titre: 'Audit RGPD — obligation légale',
      description: `${p.company_name} ne bénéficie pas encore d'un accompagnement RGPD. Le RGPD impose des obligations à toute entité traitant des données personnelles, avec des sanctions pouvant atteindre 4% du CA mondial.`,
      service_propose: 'conformite',
      ca_estime: 3500,
    }),
  },
  {
    id: 'cdd_sans_conseil',
    check: (c) =>
      c.services_souscrits.includes('contentieux') &&
      !c.services_souscrits.includes('conseil'),
    generate: (_c, p) => ({
      prospect_id: p.id,
      type: 'service_manquant',
      source: 'Recours aux CDD sans sécurisation contractuelle',
      titre: 'Sécurisation des contrats de travail (CDD/intérim)',
      description: `${p.company_name} présente un profil à risque contractuel. La sécurisation des CDD et contrats précaires permet de prévenir les requalifications en CDI (coût moyen : 15-20 K€ par dossier).`,
      service_propose: 'conseil',
      ca_estime: 2500,
    }),
  },
]

// ---------------------------------------------------------------------------
// Règles saisonnières
// ---------------------------------------------------------------------------

export const SEASONAL_RULES: SeasonalRule[] = [
  {
    id: 'nao',
    months: [1, 12],
    check: (c) => ['de_50_250', 'plus_250'].includes(c.effectif_tranche),
    generate: (c, p, month) => ({
      prospect_id: p.id,
      type: 'saisonnalite',
      source: `Saisonnalité ${month === 1 ? 'janvier' : 'décembre'} — NAO`,
      titre: 'Accompagnement NAO (Négociations Annuelles Obligatoires)',
      description: `Les NAO sont obligatoires pour ${p.company_name} (${c.effectif_tranche === 'de_50_250' ? '50-250' : '250+'} salariés). Notre accompagnement comprend la stratégie de négociation, la rédaction des accords et le suivi juridique.`,
      service_propose: 'conseil',
      ca_estime: 3000,
    }),
  },
  {
    id: 'entretiens_annuels',
    months: [2, 3],
    check: (c) =>
      ['de_11_50', 'de_50_250', 'plus_250'].includes(c.effectif_tranche),
    generate: (_c, p) => ({
      prospect_id: p.id,
      type: 'saisonnalite',
      source: 'Saisonnalité mars — Entretiens professionnels',
      titre: 'Formation managers — Entretiens professionnels',
      description: `La période des entretiens professionnels approche. Nous proposons une formation pratique aux managers de ${p.company_name} pour conduire des entretiens conformes aux exigences légales et valoriser les parcours professionnels.`,
      service_propose: 'formation',
      ca_estime: 2000,
    }),
  },
  {
    id: 'rentree_sociale',
    months: [8, 9],
    check: () => true,
    generate: (_c, p) => ({
      prospect_id: p.id,
      type: 'saisonnalite',
      source: 'Saisonnalité septembre — Rentrée sociale',
      titre: 'Audit social de rentrée',
      description: `La rentrée est le moment idéal pour réaliser un audit social chez ${p.company_name}. Vérification de la conformité des pratiques RH, des obligations légales et identification des risques pour le dernier trimestre.`,
      service_propose: 'audit',
      ca_estime: 2800,
    }),
  },
  {
    id: 'bilan_annuel',
    months: [11, 12],
    check: () => true,
    generate: (_c, p) => ({
      prospect_id: p.id,
      type: 'saisonnalite',
      source: 'Saisonnalité décembre — Bilan annuel',
      titre: 'Bilan social annuel + prévisionnel juridique',
      description: `Fin d'année chez ${p.company_name} : bilan social complet (indicateurs RH, conformité, risques) et prévisionnel juridique pour l'exercice suivant. Anticipez les évolutions réglementaires.`,
      service_propose: 'audit',
      ca_estime: 4500,
    }),
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isDuplicate(
  source: string,
  service: string,
  existing: Pick<OpportuniteIA, 'source' | 'service_propose' | 'statut'>[]
): boolean {
  return existing.some(
    (o) =>
      o.source === source &&
      o.service_propose === service &&
      !(['refusee', 'expiree'] as OpportuniteStatut[]).includes(o.statut)
  )
}

// ---------------------------------------------------------------------------
// Moteur principal de détection
// ---------------------------------------------------------------------------

export function detectOpportunites(
  client: ClientIntelligence,
  prospect: Prospect,
  actus: ActuImpact[],
  currentMonth: number,
  existingOpportunites: Pick<OpportuniteIA, 'source' | 'service_propose' | 'statut'>[]
): Omit<OpportuniteIA, 'id' | 'created_at'>[] {
  const result: Omit<OpportuniteIA, 'id' | 'created_at'>[] = []

  // Règles services manquants
  for (const rule of SERVICE_GAP_RULES) {
    if (rule.check(client)) {
      const opp = rule.generate(client, prospect)
      if (!isDuplicate(opp.source, opp.service_propose, existingOpportunites)) {
        result.push({
          ...opp,
          statut: 'nouvelle',
          email_genere: null,
          proposition_generee: null,
        })
      }
    }
  }

  // Règles saisonnières
  for (const rule of SEASONAL_RULES) {
    if (rule.months.includes(currentMonth) && rule.check(client)) {
      const opp = rule.generate(client, prospect, currentMonth)
      if (!isDuplicate(opp.source, opp.service_propose, existingOpportunites)) {
        result.push({
          ...opp,
          statut: 'nouvelle',
          email_genere: null,
          proposition_generee: null,
        })
      }
    }
  }

  // Actualités juridiques
  for (const actu of actus) {
    if (actu.clients_concernes_ids.includes(client.prospect_id)) {
      const source = `Actu juridique: ${actu.source_ref}`
      const servicePropose = actu.services_concernes[0] || 'conseil'
      if (!isDuplicate(source, servicePropose, existingOpportunites)) {
        result.push({
          prospect_id: prospect.id,
          type: 'actu_juridique',
          source,
          titre: `Impact ${actu.source_type} : ${actu.titre}`,
          description: `${actu.resume}\n\nImpact direct pour ${prospect.company_name} : une analyse et un accompagnement juridique sont recommandés.`,
          service_propose: servicePropose,
          ca_estime: 1500,
          statut: 'nouvelle',
          email_genere: null,
          proposition_generee: null,
        })
      }
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Calcul du score d'opportunité
// ---------------------------------------------------------------------------

export function calculateScore(
  client: ClientIntelligence,
  opportunites: Pick<OpportuniteIA, 'statut' | 'ca_estime'>[]
): number {
  const activeOpps = opportunites.filter((o) =>
    (['nouvelle', 'vue'] as OpportuniteStatut[]).includes(o.statut)
  )
  const totalCA = activeOpps.reduce((sum, o) => sum + (o.ca_estime || 0), 0)

  let score = 0

  // Score basé sur le nombre d'opportunités actives
  score += Math.min(activeOpps.length * 15, 60)

  // Bonus effectif
  if (client.effectif_tranche === 'plus_250') score += 20
  else if (client.effectif_tranche === 'de_50_250') score += 15
  else if (client.effectif_tranche === 'de_11_50') score += 10

  // Bonus CA potentiel
  if (totalCA > 10000) score += 20
  else if (totalCA > 5000) score += 10

  return Math.min(score, 100)
}

// ---------------------------------------------------------------------------
// Labels utilitaires
// ---------------------------------------------------------------------------

export const EFFECTIF_LABELS: Record<string, string> = {
  moins_11: 'Moins de 11 salariés',
  de_11_50: '11 à 50 salariés',
  de_50_250: '50 à 250 salariés',
  plus_250: 'Plus de 250 salariés',
}

export const OPPORTUNITE_TYPE_LABELS: Record<string, string> = {
  service_manquant: 'Service manquant',
  actu_juridique: 'Actualité juridique',
  saisonnalite: 'Saisonnalité',
}

export const OPPORTUNITE_STATUT_LABELS: Record<string, string> = {
  nouvelle: 'Nouvelle',
  vue: 'Vue',
  proposee: 'Proposée',
  acceptee: 'Acceptée',
  refusee: 'Refusée',
  expiree: 'Expirée',
}

export const ACTU_SOURCE_LABELS: Record<string, string> = {
  decret: 'Décret',
  jurisprudence: 'Jurisprudence',
  reforme: 'Réforme',
  loi: 'Loi',
  circulaire: 'Circulaire',
}

export const SERVICE_LABELS: Record<string, string> = {
  contentieux: 'Contentieux',
  conseil: 'Conseil juridique',
  conformite: 'Conformité & RGPD',
  formation: 'Formation',
  audit: 'Audit juridique',
  autre: 'Prestation juridique',
}

export const ALL_SERVICES = ['contentieux', 'conseil', 'conformite', 'formation', 'audit']

export function opportuniteStatutColor(statut: string): string {
  const colors: Record<string, string> = {
    nouvelle: '#e8842c',
    vue: '#3b82f6',
    proposee: '#8b5cf6',
    acceptee: '#10b981',
    refusee: '#ef4444',
    expiree: '#6b7280',
  }
  return colors[statut] || '#6b7280'
}

export function opportuniteStatutBg(statut: string): string {
  const colors: Record<string, string> = {
    nouvelle: '#fff7ed',
    vue: '#eff6ff',
    proposee: '#f5f3ff',
    acceptee: '#ecfdf5',
    refusee: '#fef2f2',
    expiree: '#f9fafb',
  }
  return colors[statut] || '#f9fafb'
}

export function opportuniteTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    service_manquant: '🔍',
    actu_juridique: '⚖️',
    saisonnalite: '📅',
  }
  return icons[type] || '💡'
}
