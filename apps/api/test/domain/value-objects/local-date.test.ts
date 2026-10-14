import { describe, expect, it } from 'vitest'
import { LocalDate } from '../../../src/domain/value-objects/local-date'

describe('LocalDate', () => {
  it.each(['2026-02-30', '2026-13-01', '2026-00-10', '2025-02-29', '2026-1-05', '10/10/2026'])(
    'rejects %s',
    (value) => {
      expect(() => LocalDate.parse(value)).toThrow(
        expect.objectContaining({ code: 'local_date.invalid' }),
      )
    },
  )

  it('accepts leap days', () => {
    expect(LocalDate.parse('2028-02-29').toString()).toBe('2028-02-29')
  })

  it('uses the São Paulo calendar day of an instant', () => {
    expect(LocalDate.fromInstant(new Date('2026-10-11T02:30:00Z')).toString()).toBe('2026-10-10')
    expect(LocalDate.fromInstant(new Date('2026-10-11T03:00:00Z')).toString()).toBe('2026-10-11')
  })

  it('pads years before 1000', () => {
    expect(LocalDate.fromInstant(new Date('0099-01-01T15:00:00Z')).toString()).toBe('0099-01-01')
  })

  it('rejects an invalid instant', () => {
    expect(() => LocalDate.fromInstant(new Date('invalid'))).toThrow(
      expect.objectContaining({ code: 'instant.invalid' }),
    )
  })

  it('compares dates', () => {
    const today = LocalDate.parse('2026-10-10')

    expect(LocalDate.parse('2026-10-09').isBefore(today)).toBe(true)
    expect(today.isBefore(today)).toBe(false)
    expect(today.equals(LocalDate.parse('2026-10-10'))).toBe(true)
  })

  it('is immutable', () => {
    expect(Object.isFrozen(LocalDate.parse('2026-10-10'))).toBe(true)
  })
})
