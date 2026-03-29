import type { ClientIntelligence, OpportuniteIA, ActuImpact } from '@/lib/types'
import { getServiceLabel, getEffectifLabel } from './engine'

export interface GeneratedEmail {
  sujet: string
  corps: string
}

export interface GeneratedProposition {
  titre: string
  livrables: string[]
  calendrier: string
  budget_ht: number
  tva: number
  budget_ttc: number
  validite: string
  conditions: string
}

// Configuration tarifaire par service
const SERVICE_CONFIG: Record<string, { prix_ht: number; livrables: string[]; duree: string }> = {
  audit_rh: {
    prix_ht: 3500,
    livrables: [
      'Audit complet des contrats de travail et avenants',
      'Analyse des pratiques de recrutement et onboarding',
      'Revue des procédures disciplinaires et de rupture',
      'Rapport d\'audit avec cartographie des risques RH',
      'Plan d\'action priorisé avec recommandations',
    ],
    duree: '3 à 4 semaines',
  },
  formation_managers: {
    prix_ht: 3000,
    livrables: [
      '2 journées de formation présentielle pour les managers',
      'Support de formation personnalisé (PDF + slides)',
      'Module : prévention du harcèlement et management bienveillant',
      'Module : gestion des conflits et entretiens difficiles',
      'Attestation de formation individuelle',
    ],
    duree: '2 journées + 1 semaine de préparation',
  },
  audit_rgpd: {
    prix_ht: 4500,
    livrables: [
      'Cartographie complète des traitements de données',
      'Analyse de conformité au RGPD (registre des traitements)',
      'Identification et priorisation des risques CNIL',
      'Rédaction / mise à jour des mentions légales et politiques de confidentialité',
      'Plan de mise en conformité avec calendrier',
    ],
    duree: '4 à 5 semaines',
  },
  securisation_contrats: {
    prix_ht: 2000,
    livrables: [
      'Audit de tous les contrats de travail atypiques (CDD, intérim)',
      'Identification des risques de requalification en CDI',
      'Rédaction de modèles de contrats sécurisés',
      'Guide pratique de gestion des CDD',
      'Séance de formation RH (2h)',
    ],
    duree: '2 à 3 semaines',
  },
  accompagnement_nao: {
    prix_ht: 5000,
    livrables: [
      'Analyse de l\'enveloppe salariale et benchmarks sectoriels',
      'Préparation de la stratégie de négociation',
      'Rédaction des convocations et de l\'ordre du jour légal',
      'Assistance lors de 3 séances de négociation',
      'Rédaction de l\'accord ou du procès-verbal de désaccord',
    ],
    duree: '6 à 8 semaines',
  },
  entretiens_pro: {
    prix_ht: 2500,
    livrables: [
      'Audit de conformité des entretiens professionnels en cours',
      'Modèle de trame d\'entretien professionnel personnalisé',
      'Formation des RH à la conduite des entretiens (demi-journée)',
      'Outil de suivi et de traçabilité des entretiens',
      'Note de synthèse sur les obligations légales 2026',
    ],
    duree: '2 semaines',
  },
  bilan_social: {
    prix_ht: 3000,
    livrables: [
      'Collecte et analyse des indicateurs sociaux clés',
      'Rapport de bilan social annuel conforme aux obligations légales',
      'Tableau de bord RH avec indicateurs de suivi',
      'Identification des points d\'attention et risques RH',
      'Recommandations pour l\'année suivante',
    ],
    duree: '3 semaines',
  },
  previsionnel_juridique: {
    prix_ht: 3500,
    livrables: [
      'Bilan des risques juridiques de l\'année écoulée',
      'Veille réglementaire personnalisée (nouvelles obligations)',
      'Cartographie des risques pour l\'année suivante',
      'Plan d\'action juridique priorisé',
      'Réunion de restitution avec la direction (2h)',
    ],
    duree: '3 à 4 semaines',
  },
  conseil_disciplinaire: {
    prix_ht: 2000,
    livrables: [
      'Analyse du dossier disciplinaire',
      'Conseil sur la procédure applicable',
      'Rédaction des courriers de convocation et notification',
      'Assistance lors de l\'entretien préalable',
      'Suivi post-sanction',
    ],
    duree: '1 à 2 semaines selon l\'urgence',
  },
  information_collective: {
    prix_ht: 5000,
    livrables: [
      'Analyse de l\'impact de la réforme sur l\'entreprise',
      'Conception et animation d\'une session d\'information collective (2h)',
      'Support pédagogique personnalisé pour les salariés',
      'FAQ juridique adaptée au secteur d\'activité',
      'Compte-rendu et documentation post-session',
    ],
    duree: '3 semaines',
  },
  contentieux: {
    prix_ht: 4000,
    livrables: [
      'Analyse stratégique du dossier',
      'Rédaction des conclusions et mémoires',
      'Représentation aux audiences',
      'Suivi des voies de recours',
      'Rapport de clôture',
    ],
    duree: 'Variable selon la procédure',
  },
  conseil: {
    prix_ht: 2500,
    livrables: [
      'Consultation juridique approfondie',
      'Note de synthèse juridique',
      'Recommandations pratiques',
      'Disponibilité pour questions de suivi (30 jours)',
    ],
    duree: '1 à 2 semaines',
  },
}

const TVA_RATE = 0.20

/**
 * Génère un email personnalisé pour une opportunité
 */
export function generateEmail(
  client: ClientIntelligence,
  opportunite: OpportuniteIA,
  actu?: ActuImpact | null
): GeneratedEmail {
  const service = opportunite.service_propose ?? 'conseil'
  const serviceLabel = getServiceLabel(service)
  const effectif = getEffectifLabel(client.effectif_tranche)
  const secteur = client.secteur ?? 'votre secteur d\'activité'

  let contexte = ''
  if (opportunite.type === 'actu_juridique' && actu) {
    contexte = `Suite à ${actu.titre} (${actu.source_ref ?? 'actualité récente'}), `
  } else if (opportunite.type === 'saisonnalite') {
    contexte = `En cette période clé de l\'année, `
  } else {
    contexte = `Dans le cadre de notre suivi de votre dossier, `
  }

  const urgence = opportunite.type === 'actu_juridique'
    ? 'Cette actualité récente crée une obligation de mise en conformité rapide. Nous vous recommandons d\'agir avant que des contrôles ne surviennent.'
    : 'Nos analyses montrent que ce point mérite une attention particulière pour sécuriser votre situation juridique.'

  const sujet = `${client.organisation_nom} — ${opportunite.titre.substring(0, 60)}`

  const corps = `Madame, Monsieur,

${contexte}nous souhaitons attirer votre attention sur un point qui concerne directement ${client.organisation_nom}.

**Contexte et enjeu**
${opportunite.description ?? `En tant qu'entreprise du secteur ${secteur} avec ${effectif}, vous êtes concerné(e) par les évolutions récentes du droit social.`}

**Ce que nous vous proposons : ${serviceLabel}**
Notre cabinet DAIRIA Avocats vous propose un accompagnement personnalisé pour sécuriser votre situation. Cette prestation est adaptée à votre taille (${effectif}) et à votre secteur (${secteur}).

**Pourquoi agir maintenant ?**
${urgence}

Le coût de l'inaction est généralement bien supérieur au coût d'une intervention préventive. À titre d'illustration, une procédure contentieuse dans votre secteur représente en moyenne 15 000€ à 40 000€.

**Prochaine étape**
Nous vous proposons un appel de 30 minutes pour vous présenter notre approche et répondre à vos questions, sans engagement de votre part.

Bien cordialement,

Cabinet DAIRIA Avocats
contact@dairia-avocats.fr`

  return { sujet, corps }
}

/**
 * Génère une proposition commerciale complète
 */
export function generateProposition(
  client: ClientIntelligence,
  opportunite: OpportuniteIA
): GeneratedProposition {
  const service = opportunite.service_propose ?? 'conseil'
  const config = SERVICE_CONFIG[service] ?? {
    prix_ht: opportunite.ca_estime || 2500,
    livrables: ['Prestation juridique personnalisée', 'Rapport de synthèse', 'Recommandations'],
    duree: '2 à 4 semaines',
  }

  const budget_ht = opportunite.ca_estime > 0 ? opportunite.ca_estime : config.prix_ht
  const tva = Math.round(budget_ht * TVA_RATE)
  const budget_ttc = budget_ht + tva

  const today = new Date()
  const validite = new Date(today)
  validite.setDate(validite.getDate() + 30)

  return {
    titre: opportunite.titre,
    livrables: config.livrables,
    calendrier: config.duree,
    budget_ht,
    tva,
    budget_ttc,
    validite: validite.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
    conditions: `Honoraires nets de tout frais, payables à 30 jours réception de facture. Acompte de 30% à la commande. TVA applicable au taux de 20%. Proposition valable jusqu'au ${validite.toLocaleDateString('fr-FR')}.`,
  }
}
