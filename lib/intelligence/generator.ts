import type { OpportuniteIA, Prospect, ClientIntelligence } from '@/lib/types'
import { SERVICE_LABELS, EFFECTIF_LABELS } from './engine'

// ---------------------------------------------------------------------------
// Budget par service
// ---------------------------------------------------------------------------

const CA_RANGES: Record<string, string> = {
  contentieux: '300 € - 500 €/heure',
  conseil: '250 € - 400 €/heure',
  conformite: '3 500 € - 8 000 € (forfait)',
  formation: '1 500 € - 4 000 €/session',
  audit: '2 500 € - 6 000 € (forfait)',
  autre: 'Sur devis',
}

// ---------------------------------------------------------------------------
// Génération d'email
// ---------------------------------------------------------------------------

export function generateEmail(
  opportunite: OpportuniteIA,
  prospect: Prospect,
  clientIntelligence: ClientIntelligence
): string {
  const serviceLabel = SERVICE_LABELS[opportunite.service_propose] || opportunite.service_propose
  const caRange = CA_RANGES[opportunite.service_propose] || 'Sur devis'
  const effectifLabel = EFFECTIF_LABELS[clientIntelligence.effectif_tranche] || ''
  const urgenceContext = getUrgenceContext(opportunite)
  const serviceDetail = getServiceEmailDetail(opportunite.service_propose)

  return `Objet : ${opportunite.titre} — ${prospect.company_name}

Madame, Monsieur,

Nous vous contactons au sujet de ${prospect.company_name}${clientIntelligence.secteur ? ` (secteur : ${clientIntelligence.secteur})` : ''}${effectifLabel ? `, ${effectifLabel}` : ''}.

${opportunite.description}

**Pourquoi agir maintenant ?**
${urgenceContext}

**Notre proposition : ${serviceLabel}**
${serviceDetail}

**Investissement estimé :** ${caRange}

Nous serions ravis de vous présenter notre approche lors d'un entretien de 30 minutes, sans engagement de votre part.

Dans l'attente de vous lire, nous restons à votre disposition pour toute question.

Cordialement,

Cabinet DAIRIA Avocats
Votre partenaire juridique de confiance
contact@dairia-avocats.fr`
}

function getUrgenceContext(opportunite: OpportuniteIA): string {
  if (opportunite.type === 'actu_juridique') {
    const ref = opportunite.source.replace('Actu juridique: ', '')
    return `Une récente évolution juridique (${ref}) impacte directement votre situation. Ne pas réagir rapidement expose votre entreprise à des risques significatifs et potentiellement des sanctions.`
  }
  if (opportunite.type === 'saisonnalite') {
    return `La période actuelle est stratégiquement idéale pour cette démarche. Anticiper vous permettra d'aborder la prochaine échéance avec sérénité et conformité totale.`
  }
  return `Nos analyses montrent que votre entreprise présente une exposition non couverte à ce risque. Plus tôt vous agissez, plus vous limitez votre exposition et les coûts potentiels associés.`
}

function getServiceEmailDetail(service: string): string {
  const details: Record<string, string> = {
    conformite:
      'Un audit complet de votre conformité réglementaire, incluant un plan d\'action prioritaire et un accompagnement à la mise en œuvre de vos obligations RGPD.',
    formation:
      'Un programme de formation adapté à vos équipes, dispensé par nos avocats spécialisés, avec support documentaire et attestation de formation inclus.',
    audit:
      'Un audit approfondi de vos pratiques, avec rapport détaillé, scoring des risques, identification des zones de vulnérabilité et recommandations concrètes.',
    conseil:
      'Un accompagnement juridique personnalisé : analyse de votre situation, note de recommandations, modèles de documents adaptés et suivi de mise en œuvre.',
    contentieux:
      'Une représentation et défense de vos intérêts devant les juridictions compétentes, avec stratégie de défense définie dès l\'analyse du dossier.',
  }
  return details[service] || 'Un accompagnement juridique personnalisé adapté à vos enjeux spécifiques.'
}

// ---------------------------------------------------------------------------
// Génération de proposition commerciale
// ---------------------------------------------------------------------------

export function generateProposition(
  opportunite: OpportuniteIA,
  prospect: Prospect,
  clientIntelligence: ClientIntelligence
): string {
  const serviceLabel = SERVICE_LABELS[opportunite.service_propose] || opportunite.service_propose
  const today = new Date().toLocaleDateString('fr-FR')
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')
  const deliverables = getDeliverables(opportunite.service_propose)
  const timeline = getTimeline(opportunite.service_propose)
  const budget = getBudgetBlock(opportunite)

  return `PROPOSITION COMMERCIALE CONFIDENTIELLE
Cabinet DAIRIA Avocats

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DATE : ${today}
VALIDITÉ : ${validUntil}
RÉFÉRENCE : PROP-${Date.now().toString(36).toUpperCase()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INFORMATIONS CLIENT
Entreprise : ${prospect.company_name}
${prospect.siren ? `SIREN : ${prospect.siren}` : ''}
${clientIntelligence.secteur ? `Secteur : ${clientIntelligence.secteur}` : ''}
${clientIntelligence.code_naf ? `Code NAF : ${clientIntelligence.code_naf}` : ''}
${clientIntelligence.idcc ? `Convention collective : IDCC ${clientIntelligence.idcc}` : ''}
Effectif : ${EFFECTIF_LABELS[clientIntelligence.effectif_tranche] || '—'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJET DE LA PROPOSITION
${opportunite.titre}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONTEXTE ET ENJEUX
${opportunite.description}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PÉRIMÈTRE DE LA MISSION : ${serviceLabel.toUpperCase()}

Livrables inclus :
${deliverables.map((d) => `  • ${d}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CALENDRIER PRÉVISIONNEL
${timeline}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BUDGET ET FACTURATION
${budget}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONDITIONS GÉNÉRALES
• Paiement : 50% à la commande, 50% à la livraison
• Délai de rétractation : 14 jours calendaires
• Droit applicable : Droit français
• Juridiction compétente : Tribunaux de Paris

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACCEPTATION
Cette proposition est soumise à validation. Le démarrage de la mission sera confirmé par bon de commande signé des deux parties.

Cabinet DAIRIA Avocats
contact@dairia-avocats.fr
www.dairia-avocats.fr`
}

function getDeliverables(service: string): string[] {
  const map: Record<string, string[]> = {
    audit: [
      'Audit complet des pratiques (questionnaires + entretiens managers)',
      "Rapport d'audit détaillé avec scoring de risques (RAG)",
      'Plan d\'action prioritaire (court / moyen terme)',
      'Session de restitution avec le management',
      'Suivi post-audit (3 mois)',
    ],
    conformite: [
      'Cartographie des traitements de données personnelles',
      'Analyse des risques RGPD et gap analysis',
      'Rédaction / mise à jour des politiques de confidentialité',
      'Registre de traitements (CNIL compliant)',
      'Formation des équipes (demi-journée)',
    ],
    formation: [
      'Programme de formation personnalisé (sur mesure)',
      'Support pédagogique (manuel participants + slides)',
      'Exercices pratiques et mises en situation',
      "Évaluation des acquis (quiz fin de session)",
      'Attestation de formation (certifiable CPF)',
    ],
    conseil: [
      'Analyse juridique approfondie de la situation',
      'Note de recommandations détaillée',
      "Modèles de documents contractuels adaptés",
      "Assistance à la mise en œuvre",
      'Permanence téléphonique dédiée (1 mois)',
    ],
    contentieux: [
      'Analyse du dossier et stratégie de défense',
      'Rédaction des actes de procédure',
      'Représentation devant les juridictions compétentes',
      "Compte-rendu après chaque audience",
      "Suivi jusqu'à décision définitive",
    ],
  }
  return map[service] || [
    'Accompagnement juridique personnalisé',
    'Rapport et recommandations',
    'Suivi de mise en œuvre',
  ]
}

function getTimeline(service: string): string {
  const map: Record<string, string> = {
    audit: [
      'Semaine 1-2 : Phase de collecte (questionnaires + entretiens)',
      "Semaine 3-4 : Analyse et rédaction du rapport",
      "Semaine 5 : Restitution et validation du plan d'action",
    ].join('\n'),
    conformite: [
      'Mois 1 : Diagnostic et cartographie des traitements',
      'Mois 2 : Rédaction des documents de conformité',
      'Mois 3 : Formation des équipes et déploiement',
    ].join('\n'),
    formation: [
      'J+7 : Envoi du programme et des supports',
      'J+14 : Session de formation (1 journée)',
      "J+30 : Évaluation à froid et retour d'expérience",
    ].join('\n'),
    conseil: [
      "J+3 : Analyse initiale et cadrage",
      'J+10 : Remise de la note de recommandations',
      "J+30 : Accompagnement à la mise en œuvre",
    ].join('\n'),
    contentieux: [
      "J+1 : Analyse du dossier et stratégie",
      "J+7 : Définition de la stratégie de défense",
      "Durée variable selon la procédure engagée",
    ].join('\n'),
  }
  return map[service] || 'J+7 : Démarrage de la mission\nDurée estimée : 4 semaines\nJ+30 : Livraison des livrables'
}

function getBudgetBlock(opportunite: OpportuniteIA): string {
  const service = opportunite.service_propose
  const isHourly = ['conseil', 'contentieux'].includes(service)

  if (isHourly) {
    const rate = service === 'contentieux' ? 350 : 300
    return [
      `Taux horaire : ${rate} € HT / heure`,
      `Provision estimée : ${opportunite.ca_estime} € HT`,
      `TVA (20%) : ${Math.round(opportunite.ca_estime * 0.2)} €`,
      `TOTAL ESTIMÉ : ${Math.round(opportunite.ca_estime * 1.2)} € TTC`,
      `(Facturation au réel sur la base des heures effectuées)`,
    ].join('\n')
  }

  return [
    `Forfait : ${opportunite.ca_estime} € HT`,
    `TVA (20%) : ${Math.round(opportunite.ca_estime * 0.2)} €`,
    `TOTAL : ${Math.round(opportunite.ca_estime * 1.2)} € TTC`,
  ].join('\n')
}
