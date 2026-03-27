import type { ClientIntelligence, OpportuniteIA } from '@/lib/types'
import { SERVICES, getEffectifLabel, type ServiceKey } from './engine'

export interface GeneratedEmail {
  sujet: string
  corps: string
}

export interface GeneratedProposition {
  titre: string
  introduction: string
  livrables: string[]
  calendrier: string
  budget_ht: number
  tva: number
  budget_ttc: number
  conditions: string
  validite: string
}

export function generateEmail(
  intel: ClientIntelligence,
  opportunite: OpportuniteIA,
  nomClient: string,
  nomContact?: string
): GeneratedEmail {
  const service = SERVICES[opportunite.service_propose as ServiceKey]
  const serviceLabel = service?.label ?? opportunite.service_propose
  const effectifLabel = getEffectifLabel(intel.effectif_tranche)
  const salutation = nomContact ? `Madame, Monsieur ${nomContact}` : 'Madame, Monsieur'
  const urgenceMap: Record<string, string> = {
    actu_juridique: 'une actualité juridique récente impactant directement votre entreprise',
    service_manquant: 'une analyse de votre profil juridique',
    saisonnalite: 'l\'approche d\'une échéance réglementaire importante',
  }
  const contexte = urgenceMap[opportunite.type] ?? 'notre suivi de votre dossier'

  const sujet = `${nomClient} — ${serviceLabel} : point important`

  const corps = `${salutation},

Suite à ${contexte}, nous souhaitons attirer votre attention sur un point important concernant ${nomClient}.

**Contexte**
${opportunite.description ?? opportunite.titre}

**Pourquoi agir maintenant ?**
${getRaisonUrgence(opportunite, intel)}

**Notre proposition**
Le cabinet DAIRIA Avocats vous propose un accompagnement personnalisé dans le cadre d'une mission de ${serviceLabel.toLowerCase()}. Cette mission est adaptée à votre contexte : ${intel.secteur ?? 'votre secteur'}, ${effectifLabel}.

**Bénéfices attendus**
${getBenefices(opportunite.service_propose as ServiceKey)}

**Prochaines étapes**
Nous vous proposons un échange téléphonique de 30 minutes pour évaluer vos besoins précis et vous présenter notre approche.

Restant à votre disposition,

Le Cabinet DAIRIA Avocats
contact@dairia-avocats.fr | 01 23 45 67 89`

  return { sujet, corps }
}

function getRaisonUrgence(opportunite: OpportuniteIA, intel: ClientIntelligence): string {
  if (opportunite.type === 'actu_juridique') {
    return `Une évolution réglementaire ou jurisprudentielle récente (${opportunite.source?.replace('actu:', '') ?? 'nouvelle loi'}) impacte directement votre activité. Ne pas agir expose votre entreprise à des risques juridiques et financiers significatifs.`
  }
  if (opportunite.type === 'saisonnalite') {
    return `Cette obligation est récurrente et doit être anticipée. Les entreprises qui s'y prennent à la dernière minute subissent des coûts bien supérieurs et une qualité d'accompagnement moindre.`
  }
  return `L'analyse de votre profil (${intel.secteur ?? 'secteur'}, ${getEffectifLabel(intel.effectif_tranche)}) révèle un écart entre vos obligations légales et les dispositifs en place. Cette situation représente un risque de contentieux ou de sanction administrative.`
}

function getBenefices(service: ServiceKey): string {
  const beneficesMap: Record<ServiceKey, string> = {
    audit_rh: '• Identification des risques avant qu\'ils deviennent des litiges\n• Réduction significative des coûts de contentieux\n• Conformité avec les dernières obligations légales',
    formation: '• Montée en compétences de vos managers\n• Conformité avec les obligations de formation\n• Réduction des risques de contentieux prud\'homaux',
    rgpd: '• Mise en conformité RGPD certifiée\n• Protection contre les sanctions CNIL\n• Confiance renforcée de vos clients et partenaires',
    contentieux: '• Défense experte devant les juridictions\n• Maximisation de vos chances de succès\n• Accompagnement tout au long de la procédure',
    conseil: '• Sécurisation de vos décisions RH\n• Réponses rapides à vos questions juridiques\n• Prévention des litiges',
    conformite: '• Audit complet de votre conformité sociale\n• Plan d\'action priorisé et budgété\n• Suivi de la mise en œuvre',
    contrats: '• Contrats sécurisés et adaptés à votre activité\n• Réduction du risque de requalification\n• Clarté des relations contractuelles',
    securite: '• DUERP conforme et actualisé\n• Réduction des risques d\'accidents et maladies professionnelles\n• Conformité avec les obligations légales',
    nao: '• Négociations structurées et sécurisées\n• Réduction des risques de conflit collectif\n• Accompagnement par un expert en droit social',
    bilan_social: '• Vision claire de votre situation sociale\n• Anticipation des risques 2027\n• Rapport complet pour la direction',
    autre: '• Accompagnement sur mesure\n• Expertise reconnue en droit social\n• Réactivité garantie',
  }
  return beneficesMap[service] ?? '• Expertise reconnue\n• Accompagnement personnalisé\n• Résultats mesurables'
}

export function generateProposition(
  intel: ClientIntelligence,
  opportunite: OpportuniteIA,
  nomClient: string
): GeneratedProposition {
  const service = SERVICES[opportunite.service_propose as ServiceKey]
  const serviceLabel = service?.label ?? opportunite.service_propose
  const effectifLabel = getEffectifLabel(intel.effectif_tranche)
  const budgetHt = opportunite.ca_estime
  const tva = Math.round(budgetHt * 0.2)
  const budgetTtc = budgetHt + tva

  const today = new Date()
  const validite = new Date(today)
  validite.setDate(validite.getDate() + 30)

  return {
    titre: `Proposition de mission — ${serviceLabel} — ${nomClient}`,
    introduction: `Le cabinet DAIRIA Avocats a le plaisir de vous soumettre cette proposition de mission dans le cadre d'un accompagnement en ${serviceLabel.toLowerCase()} pour ${nomClient} (${intel.secteur ?? 'votre secteur'}, ${effectifLabel}).\n\n${opportunite.description ?? opportunite.titre}`,
    livrables: getLivrables(opportunite.service_propose as ServiceKey, intel),
    calendrier: getCalendrier(opportunite.service_propose as ServiceKey),
    budget_ht: budgetHt,
    tva,
    budget_ttc: budgetTtc,
    conditions: 'Paiement à 30 jours. Acompte de 30% à la signature. TVA applicable au taux en vigueur (20%).',
    validite: validite.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
  }
}

function getLivrables(service: ServiceKey, intel: ClientIntelligence): string[] {
  const livrablesMap: Record<ServiceKey, string[]> = {
    audit_rh: [
      'Diagnostic complet des pratiques RH (entretiens, questionnaires)',
      'Rapport d\'audit détaillé avec cartographie des risques',
      'Plan d\'action priorisé avec recommandations opérationnelles',
      'Réunion de restitution avec la direction',
      'Suivi à 3 mois (1 session de 2h)',
    ],
    formation: [
      `Programme de formation adapté (${intel.effectif_tranche} salariés)`,
      'Sessions de formation en présentiel ou distanciel',
      'Support pédagogique remis aux participants',
      'Attestation de formation individuelle',
      'Compte-rendu de formation pour dossier légal',
    ],
    rgpd: [
      'Audit de conformité RGPD complet',
      'Registre des traitements mis à jour',
      'Politique de confidentialité conforme',
      'Procédures internes de gestion des données',
      'Formation de vos équipes (2h)',
      'Rapport de conformité CNIL',
    ],
    contentieux: [
      'Analyse du dossier et stratégie de défense',
      'Rédaction des conclusions',
      'Représentation aux audiences',
      'Compte-rendu après chaque audience',
      'Rapport final et recommandations',
    ],
    conseil: [
      'Permanence juridique mensuelle (2h/mois)',
      'Réponses aux questions écrites sous 48h',
      'Veille juridique sur votre secteur',
      'Note de synthèse trimestrielle',
    ],
    conformite: [
      'Audit de conformité sociale complet',
      'Rapport de non-conformités avec niveau de risque',
      'Plan de mise en conformité budgété',
      'Accompagnement à la mise en œuvre (3 mois)',
      'Attestation de conformité finale',
    ],
    contrats: [
      'Audit des contrats existants',
      'Rédaction des contrats types adaptés',
      'Guide d\'utilisation pour les RH',
      'Session de formation (2h)',
    ],
    securite: [
      'Évaluation des risques professionnels',
      'Mise à jour du DUERP (Document Unique)',
      'Programme de prévention',
      'Formation sécurité pour les managers',
    ],
    nao: [
      'Préparation stratégique des négociations',
      'Assistance lors des réunions de négociation',
      'Rédaction des procès-verbaux',
      'Finalisation des accords collectifs',
      'Dépôt légal des accords signés',
    ],
    bilan_social: [
      'Bilan social annuel complet',
      'Analyse des indicateurs RH clés',
      'Prévisionnel des risques juridiques 2027',
      'Rapport de synthèse direction',
      'Présentation aux instances représentatives',
    ],
    autre: [
      'Mission définie en concertation',
      'Rapport d\'intervention',
      'Recommandations opérationnelles',
    ],
  }
  return livrablesMap[service] ?? livrablesMap.autre
}

function getCalendrier(service: ServiceKey): string {
  const calendrierMap: Record<ServiceKey, string> = {
    audit_rh: 'Semaine 1-2 : collecte d\'informations. Semaine 3-4 : analyse et rédaction du rapport. Semaine 5 : restitution.',
    formation: 'Semaine 1 : conception du programme. Semaines 2-3 : sessions de formation. Semaine 4 : évaluation.',
    rgpd: 'Mois 1 : audit et cartographie. Mois 2 : mise en conformité et rédaction. Mois 3 : formation et validation.',
    contentieux: 'En fonction du calendrier judiciaire. Premier contact sous 48h.',
    conseil: 'Démarrage immédiat. Permanence mensuelle le premier mardi du mois.',
    conformite: 'Mois 1 : audit. Mois 2 : rapport et plan d\'action. Mois 3-5 : accompagnement.',
    contrats: 'Semaine 1 : analyse. Semaines 2-3 : rédaction. Semaine 4 : formation.',
    securite: 'Semaines 1-2 : évaluation terrain. Semaines 3-4 : DUERP et programme.',
    nao: 'Avant la 1ère réunion NAO : préparation (1 semaine). Puis accompagnement sur toute la durée des négociations.',
    bilan_social: 'Décembre : collecte données. Janvier : rédaction rapport. Février : restitution direction.',
    autre: 'Calendrier à définir selon les besoins.',
  }
  return calendrierMap[service] ?? 'Calendrier à convenir.'
}
