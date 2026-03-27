import type { ClientIntelligence, OpportuniteIA, ServiceIntelligence } from '@/lib/types'
import { serviceLabel, effectifLabel } from './engine'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmailGenere {
  sujet: string
  corps: string
}

export interface PropositionGeneree {
  titre: string
  contexte: string
  livrables: string[]
  calendrier: string
  budget_ht: number
  budget_tva: number
  budget_ttc: number
  conditions: string
}

// ---------------------------------------------------------------------------
// Données de tarification par service
// ---------------------------------------------------------------------------

interface ServiceConfig {
  tarif_base: number
  duree_jours: number
  livrables: string[]
  argument_urgence: string
  risque_inaction: string
}

const SERVICE_CONFIG: Record<ServiceIntelligence, ServiceConfig> = {
  audit_rh: {
    tarif_base: 4500,
    duree_jours: 10,
    livrables: [
      'Diagnostic complet des pratiques RH (contrats, temps de travail, disciplinaire)',
      'Rapport d\'audit avec cartographie des risques',
      'Plan d\'action priorisé avec recommandations concrètes',
      'Séance de restitution avec la direction',
    ],
    argument_urgence: 'Un contentieux prud\'homal coûte en moyenne 15 000 € à 40 000 € (frais de procédure, indemnités, temps managérial). L\'audit préventif représente un investissement 3 à 5x inférieur au coût moyen d\'un litige.',
    risque_inaction: 'Sans audit, les pratiques non conformes continuent de générer un risque juridique cumulatif. En cas de contrôle URSSAF ou de contentieux, l\'absence d\'audit constitue une circonstance aggravante.',
  },
  formation_managers: {
    tarif_base: 3200,
    duree_jours: 7,
    livrables: [
      'Programme de formation sur 2 jours (droit du travail appliqué)',
      'Guide pratique du manager conforme',
      'Modèles de documents (convocations, comptes-rendus, mise en garde)',
      'Hotline juridique post-formation (3 mois)',
    ],
    argument_urgence: 'Les managers sont en première ligne des risques RH. 78% des contentieux prud\'homaux impliquent une erreur de procédure évitable avec une formation adaptée.',
    risque_inaction: 'Un manager non formé qui commet une erreur procédurale peut invalider une sanction disciplinaire ou un licenciement, exposant l\'entreprise à une condamnation certaine.',
  },
  audit_rgpd: {
    tarif_base: 3500,
    duree_jours: 8,
    livrables: [
      'Cartographie des traitements de données personnelles',
      'Analyse des risques et lacunes de conformité',
      'Registre de traitements conforme RGPD',
      'Recommandations de mise en conformité priorisées',
      'Modèles de clauses contractuelles',
    ],
    argument_urgence: 'La CNIL a prononcé 42 sanctions en 2025 pour un total de 89 millions d\'euros. Les PME ne sont pas épargnées : 23% des sanctions visent des entreprises de moins de 250 salariés.',
    risque_inaction: 'En cas de violation de données ou de plainte d\'un salarié/client, l\'absence d\'audit RGPD constitue une circonstance aggravante et expose à des sanctions allant jusqu\'à 4% du CA mondial.',
  },
  conseil_contrats: {
    tarif_base: 2800,
    duree_jours: 5,
    livrables: [
      'Audit de la base contractuelle existante',
      'Rédaction ou révision des contrats types',
      'Mise en conformité avec la convention collective applicable',
      'Modèles de clauses spécifiques (confidentialité, non-concurrence, mobilité)',
    ],
    argument_urgence: 'Les modifications législatives récentes (jurisprudence, réforme) rendent certaines clauses de vos contrats caduques ou risquées. Une mise à jour s\'impose avant le prochain contrôle ou contentieux.',
    risque_inaction: 'Un contrat de travail non conforme peut être requalifié ou privé d\'efficacité par un juge. Les clauses de non-concurrence non conformes sont automatiquement nulles.',
  },
  nao: {
    tarif_base: 4800,
    duree_jours: 12,
    livrables: [
      'Analyse de la situation sociale de l\'entreprise (données salariales, comparatif sectoriel)',
      'Stratégie de négociation et objectifs chiffrés',
      'Assistance à la conduite des réunions de négociation',
      'Rédaction du procès-verbal d\'accord ou de désaccord',
    ],
    argument_urgence: 'Les NAO doivent être engagées dès janvier. Un retard expose l\'entreprise à des sanctions pénales (amende jusqu\'à 3 750 €) et affaiblit la position lors des négociations.',
    risque_inaction: 'L\'absence de NAO formalisées est constitutive d\'un délit pénal. De plus, une négociation mal préparée peut aboutir à des engagements supra-légaux coûteux.',
  },
  bilan_social: {
    tarif_base: 3800,
    duree_jours: 8,
    livrables: [
      'Collecte et analyse des données sociales de l\'année (effectifs, rémunérations, formation, conditions de travail)',
      'Rédaction du bilan social conforme au Code du travail',
      'Prévisionnel juridique et RH pour l\'année suivante',
      'Présentation au CSE',
    ],
    argument_urgence: 'Le bilan social doit être présenté au CSE avant le 31 décembre pour les entreprises de 300+ salariés, et en début d\'année suivante pour les autres. La préparation doit commencer dès novembre.',
    risque_inaction: 'L\'absence de bilan social est un délit d\'entrave au droit du CSE, passible de poursuites pénales et d\'une annulation des décisions prises sans consultation.',
  },
  entretiens_pro: {
    tarif_base: 2500,
    duree_jours: 5,
    livrables: [
      'Audit de conformité de la procédure actuelle',
      'Modèles de formulaires d\'entretien professionnels conformes',
      'Guide pratique pour les managers',
      'Formation flash (demi-journée) sur la conduite des entretiens',
    ],
    argument_urgence: 'Depuis le décret de février 2026, les documents d\'entretien doivent être signés par le salarié et conservés 6 ans. Le non-respect entraîne un abondement CPF de 3 000 € par salarié concerné.',
    risque_inaction: 'En cas de contrôle ou de contentieux, l\'absence d\'entretiens professionnels conformes expose à un abondement automatique du CPF de chaque salarié concerné (3 000 €/salarié).',
  },
  rentree_sociale: {
    tarif_base: 4200,
    duree_jours: 10,
    livrables: [
      'Bilan de conformité sociale complet (contrats, accords, registres)',
      'Vérification des obligations périodiques (médecine du travail, formations sécurité, DUERP)',
      'Mise à jour BDES/Base de données économiques et sociales',
      'Rapport de recommandations priorisées',
    ],
    argument_urgence: 'La rentrée sociale (septembre-octobre) est la période où l\'inspection du travail et l\'URSSAF reprennent les contrôles après la période estivale. Mieux vaut anticiper.',
    risque_inaction: 'Un contrôle de l\'inspection du travail sur une entreprise non conforme peut se traduire par des mises en demeure, des procès-verbaux et des pénalités significatives.',
  },
  info_collective: {
    tarif_base: 2800,
    duree_jours: 4,
    livrables: [
      'Note de synthèse sur la réforme et ses impacts spécifiques',
      'Présentation aux salariés (format adapté : réunion, webinaire ou FAQ)',
      'Guide pratique individuel pour les salariés',
      'Q&A personnalisé pour les questions des représentants du personnel',
    ],
    argument_urgence: 'Informer rapidement les salariés des changements qui les concernent renforce la confiance et prévient les conflits liés à une mauvaise compréhension de la réforme.',
    risque_inaction: 'Des salariés mal informés d\'une réforme importante peuvent prendre de mauvaises décisions (refus de mobilité, demande de retraite anticipée mal calculée) et générer des contentieux.',
  },
  securisation_contrats: {
    tarif_base: 2200,
    duree_jours: 4,
    livrables: [
      'Audit des contrats CDD et conventions de prestation en cours',
      'Analyse du risque de requalification',
      'Rédaction de contrats sécurisés (CDD, freelance, stage)',
      'Procédure interne de qualification des contrats',
    ],
    argument_urgence: 'La requalification d\'un CDD en CDI entraîne le paiement de l\'indemnité de requalification (1 mois de salaire minimum), des indemnités de licenciement et rappel de salaires depuis le début du contrat.',
    risque_inaction: 'En cas de requalification multiple, l\'entreprise peut faire face à plusieurs dossiers simultanés aux prud\'hommes, avec un coût total potentiellement très élevé.',
  },
  contentieux: {
    tarif_base: 2500,
    duree_jours: 0,
    livrables: [
      'Analyse de la situation et avis juridique',
      'Stratégie de défense ou d\'attaque',
      'Représentation devant les juridictions',
    ],
    argument_urgence: 'Un contentieux non traité rapidement peut générer des intérêts de retard et aggraver la situation.',
    risque_inaction: 'Sans défense juridique adaptée, les chances de succès diminuent significativement.',
  },
}

// ---------------------------------------------------------------------------
// Générateur d'emails
// ---------------------------------------------------------------------------

export function genererEmail(
  ci: ClientIntelligence,
  opportunite: OpportuniteIA
): EmailGenere {
  const config = SERVICE_CONFIG[opportunite.service_propose]
  const nomEntreprise = ci.prospect?.company_name ?? 'votre entreprise'
  const secteur = ci.secteur ?? 'votre secteur'
  const effectif = effectifLabel(ci.effectif_tranche)
  const serviceName = serviceLabel(opportunite.service_propose)
  const dateJour = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Contexte spécifique selon la source de l'opportunité
  let contexteSpecifique = ''
  if (opportunite.type === 'actu_juridique' && opportunite.source) {
    contexteSpecifique = `\n\nUne actualité juridique récente nous a conduits à analyser la situation de ${nomEntreprise} au regard de cette évolution. ${opportunite.description}`
  } else if (opportunite.type === 'saisonnalite') {
    contexteSpecifique = `\n\nNous vous contactons en ce début de période propice pour anticiper cette démarche. ${opportunite.description}`
  } else {
    contexteSpecifique = `\n\nEn analysant le profil de ${nomEntreprise}, nous avons identifié une opportunité d'optimisation importante. ${opportunite.description}`
  }

  const sujet = `${nomEntreprise} — ${opportunite.titre}`

  const corps = `Madame, Monsieur,

Dans le cadre de notre accompagnement des entreprises du secteur ${secteur}, nous avons souhaité attirer votre attention sur un point important concernant ${nomEntreprise} (${effectif}).${contexteSpecifique}

**Pourquoi agir maintenant ?**

${config.argument_urgence}

**Risque en cas d'inaction**

${config.risque_inaction}

**Notre proposition**

DAIRIA Avocats vous propose une intervention de ${serviceName} adaptée à votre contexte, d'une durée de ${config.duree_jours} jours, pour un investissement à partir de ${config.tarif_base.toLocaleString('fr-FR')} € HT.

Nous serions heureux de vous présenter notre approche lors d'un échange de 30 minutes à votre convenance.

Bien cordialement,

L'équipe DAIRIA Avocats
Cabinet spécialisé en droit social
${dateJour}`

  return { sujet, corps }
}

// ---------------------------------------------------------------------------
// Générateur de propositions commerciales
// ---------------------------------------------------------------------------

export function genererProposition(
  ci: ClientIntelligence,
  opportunite: OpportuniteIA
): PropositionGeneree {
  const config = SERVICE_CONFIG[opportunite.service_propose]
  const nomEntreprise = ci.prospect?.company_name ?? 'Client'
  const secteur = ci.secteur ?? 'votre secteur'
  const effectif = effectifLabel(ci.effectif_tranche)
  const serviceName = serviceLabel(opportunite.service_propose)

  const budget_ht = opportunite.ca_estime || config.tarif_base
  const budget_tva = Math.round(budget_ht * 0.2)
  const budget_ttc = budget_ht + budget_tva

  const dateDebut = new Date()
  dateDebut.setDate(dateDebut.getDate() + 14)
  const dateFin = new Date(dateDebut)
  dateFin.setDate(dateFin.getDate() + config.duree_jours)

  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }

  return {
    titre: `Proposition — ${serviceName} — ${nomEntreprise}`,
    contexte: `${nomEntreprise} (${effectif}, secteur ${secteur}) a sollicité DAIRIA Avocats dans le cadre de la mission suivante : ${opportunite.titre}. ${opportunite.description}`,
    livrables: config.livrables,
    calendrier: `Démarrage proposé : ${dateDebut.toLocaleDateString('fr-FR', opts)} — Livraison finale : ${dateFin.toLocaleDateString('fr-FR', opts)} (${config.duree_jours} jours ouvrés)`,
    budget_ht,
    budget_tva,
    budget_ttc,
    conditions: `Proposition valable 30 jours. Acompte de 30% à la signature. Solde à la livraison. Nos honoraires sont exprimés en euros HT, TVA applicable au taux en vigueur (20%). Conditions générales de service DAIRIA Avocats applicables.`,
  }
}
