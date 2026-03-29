import {
  formatCurrency,
  formatDate,
  stageToProbability,
  stageLabel,
  stageColor,
  scoreBadgeClass,
  scoreLabel,
  propositionStatusLabel,
  propositionStatusClass,
  taskStatusLabel,
  taskPriorityLabel,
  taskPriorityClass,
  truncate,
  isValidEmail,
  sanitizeInput,
  sanitizeUrl,
  getInitials,
  sourceLabel,
  generatePassword,
  cn,
} from '@/lib/utils'

describe('formatCurrency', () => {
  it('formats euro amounts correctly', () => {
    expect(formatCurrency(1000)).toMatch(/1/)
    expect(formatCurrency(0)).toMatch(/0/)
    expect(formatCurrency(1500000)).toContain('1')
  })

  it('handles negative values', () => {
    const result = formatCurrency(-500)
    expect(result).toContain('500')
  })
})

describe('formatDate', () => {
  it('returns dash for null', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined)).toBe('—')
  })

  it('formats valid date', () => {
    const result = formatDate('2024-01-15T00:00:00Z')
    expect(result).toMatch(/15/)
    expect(result).toMatch(/01/)
    expect(result).toMatch(/2024/)
  })

  it('returns dash for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('—')
  })
})

describe('stageToProbability', () => {
  it('returns correct probability for each stage', () => {
    expect(stageToProbability('prospect')).toBe(10)
    expect(stageToProbability('qualification')).toBe(25)
    expect(stageToProbability('proposition')).toBe(50)
    expect(stageToProbability('negociation')).toBe(75)
    expect(stageToProbability('gagne')).toBe(100)
    expect(stageToProbability('perdu')).toBe(0)
  })
})

describe('stageLabel', () => {
  it('returns French labels', () => {
    expect(stageLabel('prospect')).toBe('Prospect')
    expect(stageLabel('qualification')).toBe('Qualification')
    expect(stageLabel('proposition')).toBe('Proposition')
    expect(stageLabel('negociation')).toBe('Négociation')
    expect(stageLabel('gagne')).toBe('Gagné')
    expect(stageLabel('perdu')).toBe('Perdu')
  })
})

describe('stageColor', () => {
  it('returns hex colors', () => {
    const stages = ['prospect', 'qualification', 'proposition', 'negociation', 'gagne', 'perdu'] as const
    stages.forEach((stage) => {
      const color = stageColor(stage)
      expect(color).toMatch(/^#[0-9a-f]{6}$/i)
    })
  })

  it('returns green for gagne', () => {
    expect(stageColor('gagne')).toBe('#10b981')
  })

  it('returns red for perdu', () => {
    expect(stageColor('perdu')).toBe('#ef4444')
  })
})

describe('scoreBadgeClass', () => {
  it('returns CSS classes for each score', () => {
    expect(scoreBadgeClass('chaud')).toContain('red')
    expect(scoreBadgeClass('tiede')).toContain('orange')
    expect(scoreBadgeClass('froid')).toContain('blue')
  })
})

describe('scoreLabel', () => {
  it('returns labeled scores with emoji', () => {
    expect(scoreLabel('chaud')).toContain('Chaud')
    expect(scoreLabel('tiede')).toContain('Tiède')
    expect(scoreLabel('froid')).toContain('Froid')
  })
})

describe('propositionStatusLabel', () => {
  it('returns French labels', () => {
    expect(propositionStatusLabel('brouillon')).toBe('Brouillon')
    expect(propositionStatusLabel('envoyee')).toBe('Envoyée')
    expect(propositionStatusLabel('acceptee')).toBe('Acceptée')
    expect(propositionStatusLabel('refusee')).toBe('Refusée')
    expect(propositionStatusLabel('expiree')).toBe('Expirée')
  })
})

describe('propositionStatusClass', () => {
  it('returns CSS classes', () => {
    const statuses = ['brouillon', 'envoyee', 'acceptee', 'refusee', 'expiree'] as const
    statuses.forEach((status) => {
      const cls = propositionStatusClass(status)
      expect(typeof cls).toBe('string')
      expect(cls.length).toBeGreaterThan(0)
    })
  })

  it('returns green class for acceptee', () => {
    expect(propositionStatusClass('acceptee')).toContain('green')
  })
})

describe('taskStatusLabel', () => {
  it('returns French labels', () => {
    expect(taskStatusLabel('a_faire')).toBe('À faire')
    expect(taskStatusLabel('en_cours')).toBe('En cours')
    expect(taskStatusLabel('fait')).toBe('Fait')
    expect(taskStatusLabel('annule')).toBe('Annulé')
  })
})

describe('taskPriorityLabel', () => {
  it('returns priority labels', () => {
    expect(taskPriorityLabel('faible')).toBe('Faible')
    expect(taskPriorityLabel('normale')).toBe('Normale')
    expect(taskPriorityLabel('haute')).toBe('Haute')
  })
})

describe('taskPriorityClass', () => {
  it('returns CSS classes for priorities', () => {
    expect(taskPriorityClass('faible')).toContain('gray')
    expect(taskPriorityClass('normale')).toContain('blue')
    expect(taskPriorityClass('haute')).toContain('red')
  })
})

describe('truncate', () => {
  it('returns string as-is if within limit', () => {
    expect(truncate('Hello', 10)).toBe('Hello')
  })

  it('truncates long strings', () => {
    const long = 'A'.repeat(60)
    const result = truncate(long, 50)
    expect(result.length).toBeLessThanOrEqual(53) // 50 + '...'
    expect(result.endsWith('...')).toBe(true)
  })

  it('uses default max length of 50', () => {
    const long = 'A'.repeat(60)
    const result = truncate(long)
    expect(result.endsWith('...')).toBe(true)
  })
})

describe('isValidEmail', () => {
  it('validates correct emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true)
    expect(isValidEmail('user@sub.domain.fr')).toBe(true)
  })

  it('rejects invalid emails', () => {
    expect(isValidEmail('notanemail')).toBe(false)
    expect(isValidEmail('@domain.com')).toBe(false)
    expect(isValidEmail('user@')).toBe(false)
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('user @domain.com')).toBe(false)
  })
})

describe('sanitizeInput', () => {
  it('escapes HTML special characters', () => {
    const input = '<script>alert("xss")</script>'
    const result = sanitizeInput(input)
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('</script>')
    expect(result).toContain('&lt;')
    expect(result).toContain('&gt;')
  })

  it('escapes quotes', () => {
    const result = sanitizeInput('"quoted"')
    expect(result).toContain('&quot;')
  })

  it('escapes single quotes', () => {
    const result = sanitizeInput("it's")
    expect(result).toContain('&#x27;')
  })

  it('leaves safe strings unchanged', () => {
    const safe = 'Hello World 123'
    expect(sanitizeInput(safe)).toBe(safe)
  })
})

describe('getInitials', () => {
  it('gets initials from full name', () => {
    expect(getInitials('Marie Dupont')).toBe('MD')
    expect(getInitials('Jean Paul Martin')).toBe('JP')
  })

  it('handles single name', () => {
    expect(getInitials('Jean')).toBe('J')
  })

  it('returns ? for null/undefined', () => {
    expect(getInitials(null)).toBe('?')
    expect(getInitials(undefined)).toBe('?')
  })

  it('handles email-like strings', () => {
    const result = getInitials('user@example.com')
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns max 2 chars', () => {
    const result = getInitials('A B C D E')
    expect(result.length).toBeLessThanOrEqual(2)
  })
})

describe('sourceLabel', () => {
  it('returns French labels for known sources', () => {
    expect(sourceLabel('referral')).toBe('Recommandation')
    expect(sourceLabel('website')).toBe('Site web')
    expect(sourceLabel('linkedin')).toBe('LinkedIn')
    expect(sourceLabel('cold_call')).toBe('Prospection')
    expect(sourceLabel('event')).toBe('Événement')
    expect(sourceLabel('autre')).toBe('Autre')
  })

  it('returns source as-is for unknown', () => {
    expect(sourceLabel('unknown_source')).toBe('unknown_source')
  })
})

describe('sanitizeUrl', () => {
  it('allows valid http URLs', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com')
  })

  it('allows valid https URLs', () => {
    expect(sanitizeUrl('https://example.com/path?q=1')).toBe('https://example.com/path?q=1')
  })

  it('blocks javascript: URLs (XSS prevention)', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull()
    expect(sanitizeUrl('javascript:void(0)')).toBeNull()
  })

  it('blocks data: URLs', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull()
  })

  it('blocks vbscript: URLs', () => {
    expect(sanitizeUrl('vbscript:msgbox(1)')).toBeNull()
  })

  it('returns null for null/undefined/empty', () => {
    expect(sanitizeUrl(null)).toBeNull()
    expect(sanitizeUrl(undefined)).toBeNull()
    expect(sanitizeUrl('')).toBeNull()
  })

  it('returns null for invalid URLs', () => {
    expect(sanitizeUrl('not a url')).toBeNull()
    expect(sanitizeUrl('://missing-scheme')).toBeNull()
  })
})

describe('generatePassword', () => {
  it('generates a 16-character password', () => {
    const pwd = generatePassword()
    expect(pwd).toHaveLength(16)
  })

  it('generates different passwords each time', () => {
    const passwords = new Set(Array.from({ length: 10 }, () => generatePassword()))
    expect(passwords.size).toBeGreaterThan(1)
  })
})

describe('cn (classname helper)', () => {
  it('merges class names', () => {
    const result = cn('foo', 'bar')
    expect(result).toContain('foo')
    expect(result).toContain('bar')
  })

  it('handles conditional classes', () => {
    const result = cn('base', false && 'hidden', 'visible')
    expect(result).toContain('base')
    expect(result).toContain('visible')
    expect(result).not.toContain('hidden')
  })

  it('deduplicates conflicting tailwind classes', () => {
    const result = cn('px-4', 'px-2')
    expect(result).toContain('px-2')
    expect(result).not.toContain('px-4')
  })
})
