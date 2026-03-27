import Anthropic from '@anthropic-ai/sdk'
import type { Prospect, Deal, Interaction, Contact } from './types'

export interface ClientProfile {
  prospect: Prospect
  deal: Deal
  interactions: Interaction[]
  contacts: Contact[]
}

export interface GeneratedProposal {
  email_subject: string
  email_body: string
  key_arguments: string[]
  urgency_reason: string
  risk_if_no_action: string
}

function buildPrompt(profile: ClientProfile): string {
  const { prospect, deal, interactions, contacts } = profile
  const primaryContact = contacts.find((c) => c.is_primary) ?? contacts[0]
  const interactionSummary = interactions
    .slice(0, 5)
    .map((i) => `- ${i.type} (${i.date}): ${i.notes ?? 'Sans notes'}`)
    .join('\n')

  return `Tu es un avocat associé senior du cabinet DAIRIA Avocats, expert en droit des affaires.
Tu dois rédiger une proposition commerciale personnalisée pour le prospect suivant.

## Profil client
- **Entreprise** : ${prospect.company_name}
- **Secteur** : ${prospect.sector ?? 'Non précisé'}
- **Taille** : ${prospect.size ?? 'Non précisée'}
- **Score** : ${prospect.score}
- **Tags** : ${prospect.tags?.join(', ') || 'Aucun'}
- **Notes** : ${prospect.notes ?? 'Aucune'}

## Contact principal
${primaryContact ? `- **Nom** : ${primaryContact.name}\n- **Fonction** : ${primaryContact.function ?? 'Non précisée'}` : 'Aucun contact identifié'}

## Opportunité commerciale
- **Titre** : ${deal.title}
- **Montant estimé** : ${deal.amount ? deal.amount + ' € HT' : 'Non défini'}
- **Étape** : ${deal.stage}
- **Source** : ${deal.source ?? 'Non précisée'}

## Historique des interactions
${interactionSummary || 'Aucune interaction enregistrée'}

## Instructions
Génère une proposition commerciale structurée en JSON strict (sans bloc markdown, uniquement le JSON brut) avec ce format exact :
{
  "email_subject": "Objet de l'email (accrocheur et personnalisé)",
  "email_body": "Corps de l'email complet en texte simple avec des sauts de ligne, signé par DAIRIA Avocats",
  "key_arguments": ["argument 1", "argument 2", "argument 3"],
  "urgency_reason": "Pourquoi agir maintenant (contexte légal, opportunité, deadline)",
  "risk_if_no_action": "Risque concret si le client ne fait rien"
}

Règles :
- Ton professionnel, expert, empathique — adapté à un cabinet d'avocats haut de gamme
- Email personnalisé au secteur et à la situation du client
- Arguments précis et actionnables, pas de généralités
- 3 arguments minimum, 5 maximum
- Pas de balises HTML dans email_body, utiliser des sauts de ligne \\n`
}

function parseResponse(text: string): GeneratedProposal {
  const cleaned = text
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim()

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(cleaned) as Record<string, unknown>
  } catch {
    throw new Error('Impossible de parser la réponse Claude — JSON invalide')
  }

  if (
    typeof parsed.email_subject !== 'string' ||
    typeof parsed.email_body !== 'string' ||
    !Array.isArray(parsed.key_arguments)
  ) {
    throw new Error('Format de réponse Claude invalide — champs manquants')
  }

  return {
    email_subject: parsed.email_subject,
    email_body: parsed.email_body,
    key_arguments: parsed.key_arguments as string[],
    urgency_reason: typeof parsed.urgency_reason === 'string' ? parsed.urgency_reason : '',
    risk_if_no_action: typeof parsed.risk_if_no_action === 'string' ? parsed.risk_if_no_action : '',
  }
}

export async function generateProposal(profile: ClientProfile): Promise<GeneratedProposal> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY non configurée')
  }

  const client = new Anthropic({ apiKey })

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: buildPrompt(profile),
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    throw new Error('Type de réponse Claude inattendu')
  }

  return parseResponse(content.text)
}
