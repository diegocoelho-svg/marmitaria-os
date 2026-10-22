import { describe, expect, it } from 'vitest'
import { SessionEntity } from '@/domain/entities/session-entity'

const start = new Date('2026-10-20T12:00:00Z')

function session() {
  return SessionEntity.start({ id: 'session-1', userId: 'user-1', now: start })
}

describe('SessionEntity', () => {
  it('lasts thirty days from the sign in', () => {
    const current = session()

    expect(current.expiresAt).toEqual(new Date('2026-11-19T12:00:00Z'))
    expect(current.isExpiredAt(new Date('2026-11-19T11:59:59Z'))).toBe(false)
    expect(current.isExpiredAt(new Date('2026-11-19T12:00:00Z'))).toBe(true)
  })

  it('asks for renewal at most once a day', () => {
    const current = session()

    expect(current.needsRenewalAt(new Date('2026-10-21T11:59:59Z'))).toBe(false)
    expect(current.needsRenewalAt(new Date('2026-10-21T12:00:00Z'))).toBe(true)
  })

  it('renews for another thirty days from the given instant', () => {
    const current = session()

    current.renew(new Date('2026-11-01T08:00:00Z'))

    expect(current.expiresAt).toEqual(new Date('2026-12-01T08:00:00Z'))
    expect(current.needsRenewalAt(new Date('2026-11-01T09:00:00Z'))).toBe(false)
  })

  it('keeps its expiry isolated from callers', () => {
    const current = session()

    current.expiresAt.setUTCFullYear(2100)

    expect(current.expiresAt).toEqual(new Date('2026-11-19T12:00:00Z'))
  })
})
