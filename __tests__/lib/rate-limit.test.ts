import { rateLimit, getClientIp } from '@/lib/rate-limit'

describe('rateLimit', () => {
  it('allows requests within the limit', () => {
    const id = `test-${Date.now()}-allow`
    const result = rateLimit(id, { limit: 5, windowMs: 10000 })
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('blocks requests that exceed the limit', () => {
    const id = `test-${Date.now()}-block`
    const opts = { limit: 3, windowMs: 10000 }
    rateLimit(id, opts)
    rateLimit(id, opts)
    rateLimit(id, opts)
    const blocked = rateLimit(id, opts)
    expect(blocked.success).toBe(false)
    expect(blocked.remaining).toBe(0)
  })

  it('counts remaining correctly', () => {
    const id = `test-${Date.now()}-remaining`
    const opts = { limit: 5, windowMs: 10000 }
    const r1 = rateLimit(id, opts)
    expect(r1.remaining).toBe(4)
    const r2 = rateLimit(id, opts)
    expect(r2.remaining).toBe(3)
    const r3 = rateLimit(id, opts)
    expect(r3.remaining).toBe(2)
  })

  it('uses separate buckets per identifier', () => {
    const opts = { limit: 2, windowMs: 10000 }
    const id1 = `test-${Date.now()}-sep1`
    const id2 = `test-${Date.now()}-sep2`
    rateLimit(id1, opts)
    rateLimit(id1, opts)
    const blockedId1 = rateLimit(id1, opts)
    expect(blockedId1.success).toBe(false)

    const id2Result = rateLimit(id2, opts)
    expect(id2Result.success).toBe(true)
  })

  it('provides a resetAt timestamp in the future', () => {
    const id = `test-${Date.now()}-reset`
    const result = rateLimit(id, { limit: 5, windowMs: 10000 })
    expect(result.resetAt).toBeGreaterThan(Date.now())
  })
})

describe('getClientIp', () => {
  it('extracts IP from x-forwarded-for header', () => {
    const headers = new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' })
    expect(getClientIp(headers)).toBe('1.2.3.4')
  })

  it('extracts IP from x-real-ip header', () => {
    const headers = new Headers({ 'x-real-ip': '9.10.11.12' })
    expect(getClientIp(headers)).toBe('9.10.11.12')
  })

  it('falls back to unknown when no IP header present', () => {
    const headers = new Headers()
    expect(getClientIp(headers)).toBe('unknown')
  })

  it('prefers x-forwarded-for over x-real-ip', () => {
    const headers = new Headers({
      'x-forwarded-for': '1.2.3.4',
      'x-real-ip': '9.10.11.12',
    })
    expect(getClientIp(headers)).toBe('1.2.3.4')
  })
})
