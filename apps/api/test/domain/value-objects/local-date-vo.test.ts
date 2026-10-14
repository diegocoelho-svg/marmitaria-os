import { describe, expect, it } from 'vitest'
import { InstantInvalidError } from '../../../src/domain/errors/instant-invalid.error'
import { LocalDateInvalidError } from '../../../src/domain/errors/local-date-invalid.error'
import { LocalDateVO } from '../../../src/domain/value-objects/local-date-vo'

describe('LocalDateVO', () => {
  it.each(['2026-02-30', '2026-13-01', '2026-00-10', '2025-02-29', '2026-1-05', '10/10/2026'])(
    'rejects %s',
    (value) => {
      expect(() => LocalDateVO.parse(value)).toThrow(LocalDateInvalidError)
    },
  )

  it('accepts leap days', () => {
    expect(LocalDateVO.parse('2028-02-29').toString()).toBe('2028-02-29')
  })

  it('uses the São Paulo calendar day of an instant', () => {
    expect(LocalDateVO.fromInstant(new Date('2026-10-11T02:30:00Z')).toString()).toBe('2026-10-10')
    expect(LocalDateVO.fromInstant(new Date('2026-10-11T03:00:00Z')).toString()).toBe('2026-10-11')
  })

  it('pads years before 1000', () => {
    expect(LocalDateVO.fromInstant(new Date('0099-01-01T15:00:00Z')).toString()).toBe('0099-01-01')
  })

  it('rejects an invalid instant', () => {
    expect(() => LocalDateVO.fromInstant(new Date('invalid'))).toThrow(InstantInvalidError)
  })

  it('compares dates', () => {
    const today = LocalDateVO.parse('2026-10-10')

    expect(LocalDateVO.parse('2026-10-09').isBefore(today)).toBe(true)
    expect(today.isBefore(today)).toBe(false)
    expect(today.equals(LocalDateVO.parse('2026-10-10'))).toBe(true)
  })

  it('is immutable', () => {
    expect(Object.isFrozen(LocalDateVO.parse('2026-10-10'))).toBe(true)
  })
})
