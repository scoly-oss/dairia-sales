/**
 * Type guard tests — ensure our type definitions are correct
 */
import type {
  UserRole, ProspectScore, DealStage, PropositionStatus,
  TaskStatus, TaskPriority, ServiceCategory, Profile, Prospect, Deal
} from '@/lib/types'

describe('Type definitions', () => {
  it('UserRole includes expected roles', () => {
    const roles: UserRole[] = ['admin', 'commercial', 'avocat']
    expect(roles).toHaveLength(3)
  })

  it('ProspectScore includes expected scores', () => {
    const scores: ProspectScore[] = ['chaud', 'tiede', 'froid']
    expect(scores).toHaveLength(3)
  })

  it('DealStage includes all pipeline stages', () => {
    const stages: DealStage[] = [
      'prospect', 'qualification', 'proposition', 'negociation', 'gagne', 'perdu'
    ]
    expect(stages).toHaveLength(6)
  })

  it('PropositionStatus includes all states', () => {
    const statuses: PropositionStatus[] = [
      'brouillon', 'envoyee', 'acceptee', 'refusee', 'expiree'
    ]
    expect(statuses).toHaveLength(5)
  })

  it('TaskStatus includes all states', () => {
    const statuses: TaskStatus[] = ['a_faire', 'en_cours', 'fait', 'annule']
    expect(statuses).toHaveLength(4)
  })

  it('TaskPriority includes all levels', () => {
    const priorities: TaskPriority[] = ['faible', 'normale', 'haute']
    expect(priorities).toHaveLength(3)
  })

  it('ServiceCategory includes all categories', () => {
    const categories: ServiceCategory[] = [
      'contentieux', 'conseil', 'conformite', 'formation', 'audit', 'autre'
    ]
    expect(categories).toHaveLength(6)
  })

  it('Profile has required fields', () => {
    const profile: Profile = {
      id: 'test-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'commercial',
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    expect(profile.id).toBe('test-id')
    expect(profile.email).toBe('test@example.com')
    expect(profile.role).toBe('commercial')
  })

  it('Prospect has required fields', () => {
    const prospect: Prospect = {
      id: 'prospect-id',
      company_name: 'ACME SAS',
      siren: null,
      sector: null,
      size: null,
      website: null,
      address: null,
      score: 'froid',
      tags: [],
      notes: null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    expect(prospect.company_name).toBe('ACME SAS')
    expect(prospect.score).toBe('froid')
  })

  it('Deal has required numeric fields', () => {
    const deal: Deal = {
      id: 'deal-id',
      prospect_id: 'prospect-id',
      title: 'Test Deal',
      amount: 5000,
      stage: 'prospect',
      probability: 10,
      source: null,
      assigned_to: null,
      notes: null,
      closed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    expect(deal.amount).toBe(5000)
    expect(deal.probability).toBe(10)
    expect(deal.stage).toBe('prospect')
  })
})
