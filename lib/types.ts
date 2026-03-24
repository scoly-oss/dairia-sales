export type UserRole = 'admin' | 'commercial' | 'avocat'
export type ProspectScore = 'chaud' | 'tiede' | 'froid'
export type DealStage = 'prospect' | 'qualification' | 'proposition' | 'negociation' | 'gagne' | 'perdu'
export type InteractionType = 'appel' | 'email' | 'meeting' | 'note' | 'autre'
export type PropositionStatus = 'brouillon' | 'envoyee' | 'acceptee' | 'refusee' | 'expiree'
export type TaskStatus = 'a_faire' | 'en_cours' | 'fait' | 'annule'
export type TaskPriority = 'faible' | 'normale' | 'haute'
export type ServiceCategory = 'contentieux' | 'conseil' | 'conformite' | 'formation' | 'audit' | 'autre'
export type EmailTemplateCategory = 'prospection' | 'relance' | 'proposition' | 'remerciement' | 'autre'
export type DealSource = 'referral' | 'website' | 'linkedin' | 'cold_call' | 'event' | 'autre'

export interface Profile {
  id: string
  email: string
  name: string | null
  role: UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Prospect {
  id: string
  company_name: string
  siren: string | null
  sector: string | null
  size: string | null
  website: string | null
  address: string | null
  score: ProspectScore
  tags: string[]
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // joined
  contacts?: Contact[]
  interactions?: Interaction[]
  deals?: Deal[]
}

export interface Contact {
  id: string
  prospect_id: string
  name: string
  email: string | null
  phone: string | null
  function: string | null
  is_primary: boolean
  created_at: string
}

export interface Interaction {
  id: string
  prospect_id: string
  type: InteractionType
  notes: string | null
  date: string
  created_by: string | null
  created_at: string
  profile?: Profile
}

export interface Deal {
  id: string
  prospect_id: string
  title: string
  amount: number
  stage: DealStage
  probability: number
  source: DealSource | null
  assigned_to: string | null
  notes: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
  // joined
  prospect?: Prospect
  assignee?: Profile
}

export interface Service {
  id: string
  name: string
  category: ServiceCategory
  description: string | null
  unit_price: number | null
  hourly_rate: number | null
  is_hourly: boolean
  created_at: string
  updated_at: string
}

export interface PropositionItem {
  id: string
  proposition_id: string
  service_id: string | null
  description: string
  quantity: number
  unit_price: number
  total_price: number
  sort_order: number
  service?: Service
}

export interface Proposition {
  id: string
  deal_id: string | null
  prospect_id: string
  title: string
  status: PropositionStatus
  total_amount: number
  conditions: string | null
  valid_until: string | null
  sent_at: string | null
  opened_at: string | null
  answered_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // joined
  prospect?: Prospect
  deal?: Deal
  items?: PropositionItem[]
  creator?: Profile
}

export interface Task {
  id: string
  prospect_id: string | null
  deal_id: string | null
  title: string
  description: string | null
  due_date: string | null
  status: TaskStatus
  priority: TaskPriority
  assigned_to: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // joined
  prospect?: Prospect
  deal?: Deal
  assignee?: Profile
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  category: EmailTemplateCategory
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface EmailSent {
  id: string
  prospect_id: string | null
  template_id: string | null
  to_email: string
  subject: string
  body: string
  status: 'envoye' | 'echec' | 'brouillon'
  sent_at: string
  created_by: string | null
  prospect?: Prospect
  template?: EmailTemplate
}

export interface DashboardStats {
  ca_previsionnel: number
  ca_realise_mois: number
  ca_realise_trimestre: number
  ca_realise_annee: number
  taux_conversion: number
  nouveaux_prospects_semaine: number
  deals_en_cours: number
  top_deals: Deal[]
}
