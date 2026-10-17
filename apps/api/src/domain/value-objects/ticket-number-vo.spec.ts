import { describe, expect, it } from 'vitest'
import { TicketNumberInvalidError } from '@/domain/errors/ticket-number-invalid.error'
import { TicketNumberVO } from '@/domain/value-objects/ticket-number-vo'

describe('TicketNumberVO', () => {
  it.each([
    [1, '001'],
    [42, '042'],
    [1234, '1234'],
  ])('formats %i as %s', (value, formatted) => {
    expect(TicketNumberVO.of(value).format()).toBe(formatted)
  })

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])('rejects %s', (value) => {
    expect(() => TicketNumberVO.of(value)).toThrow(TicketNumberInvalidError)
  })

  it('is immutable', () => {
    expect(Object.isFrozen(TicketNumberVO.of(1))).toBe(true)
  })
})
