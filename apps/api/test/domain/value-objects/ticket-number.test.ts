import { describe, expect, it } from 'vitest'
import { TicketNumber } from '../../../src/domain/value-objects/ticket-number'

describe('TicketNumber', () => {
  it.each([
    [1, '001'],
    [42, '042'],
    [1234, '1234'],
  ])('formats %i as %s', (value, formatted) => {
    expect(TicketNumber.of(value).format()).toBe(formatted)
  })

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])('rejects %s', (value) => {
    expect(() => TicketNumber.of(value)).toThrow(
      expect.objectContaining({ code: 'ticket_number.invalid' }),
    )
  })

  it('is immutable', () => {
    expect(Object.isFrozen(TicketNumber.of(1))).toBe(true)
  })
})
