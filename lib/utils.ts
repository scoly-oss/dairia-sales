import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, isValid } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { DealStage, ProspectScore, PropositionStatus, TaskStatus, TaskPriority } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr: string | null | undefined, fmt = 'dd/MM/yyyy'): string {
  if (!dateStr) return '—'
  const date = parseISO(dateStr)
  if (!isValid(date)) return '—'
  return format(date, fmt, { locale: fr })
}

export function formatDateRelative(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const date = parseISO(dateStr)
  if (!isValid(date)) return '—'
  return format(date, "d MMMM yyyy 'à' HH:mm", { locale: fr })
}

export function stageToProbability(stage: DealStage): number {
  const map: Record<DealStage, number> = {
    prospect: 10,
    qualification: 25,
    proposition: 50,
    negociation: 75,
    gagne: 100,
    perdu: 0,
  }
  return map[stage]
}

export function stageLabel(stage: DealStage): string {
  const map: Record<DealStage, string> = {
    prospect: 'Prospect',
    qualification: 'Qualification',
    proposition: 'Proposition',
    negociation: 'Négociation',
    gagne: 'Gagné',
    perdu: 'Perdu',
  }
  return map[stage]
}

export function stageColor(stage: DealStage): string {
  const map: Record<DealStage, string> = {
    prospect: '#6b7280',
    qualification: '#8b5cf6',
    proposition: '#e8842c',
    negociation: '#f59e0b',
    gagne: '#10b981',
    perdu: '#ef4444',
  }
  return map[stage]
}

export function scoreBadgeClass(score: ProspectScore): string {
  const map: Record<ProspectScore, string> = {
    chaud: 'bg-red-100 text-red-700',
    tiede: 'bg-orange-100 text-orange-700',
    froid: 'bg-blue-100 text-blue-700',
  }
  return map[score]
}

export function scoreLabel(score: ProspectScore): string {
  const map: Record<ProspectScore, string> = {
    chaud: '🔴 Chaud',
    tiede: '🟠 Tiède',
    froid: '🔵 Froid',
  }
  return map[score]
}

export function propositionStatusLabel(status: PropositionStatus): string {
  const map: Record<PropositionStatus, string> = {
    brouillon: 'Brouillon',
    envoyee: 'Envoyée',
    acceptee: 'Acceptée',
    refusee: 'Refusée',
    expiree: 'Expirée',
  }
  return map[status]
}

export function propositionStatusClass(status: PropositionStatus): string {
  const map: Record<PropositionStatus, string> = {
    brouillon: 'bg-gray-100 text-gray-700',
    envoyee: 'bg-blue-100 text-blue-700',
    acceptee: 'bg-green-100 text-green-700',
    refusee: 'bg-red-100 text-red-700',
    expiree: 'bg-orange-100 text-orange-700',
  }
  return map[status]
}

export function taskStatusLabel(status: TaskStatus): string {
  const map: Record<TaskStatus, string> = {
    a_faire: 'À faire',
    en_cours: 'En cours',
    fait: 'Fait',
    annule: 'Annulé',
  }
  return map[status]
}

export function taskPriorityLabel(priority: TaskPriority): string {
  const map: Record<TaskPriority, string> = {
    faible: 'Faible',
    normale: 'Normale',
    haute: 'Haute',
  }
  return map[priority]
}

export function taskPriorityClass(priority: TaskPriority): string {
  const map: Record<TaskPriority, string> = {
    faible: 'bg-gray-100 text-gray-600',
    normale: 'bg-blue-100 text-blue-600',
    haute: 'bg-red-100 text-red-600',
  }
  return map[priority]
}

export function truncate(str: string, maxLength = 50): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

export function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  let password = ''
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function sourceLabel(source: string): string {
  const map: Record<string, string> = {
    referral: 'Recommandation',
    website: 'Site web',
    linkedin: 'LinkedIn',
    cold_call: 'Prospection',
    event: 'Événement',
    autre: 'Autre',
  }
  return map[source] || source
}
