import { describe, expect, it } from 'vitest'
import { DomainError } from '../../../src/domain/errors/domain-error'
import { OrderInvalidTransitionError } from '../../../src/domain/errors/order-invalid-transition.error'

describe('DomainError', () => {
  it('carries a stable code and the class name', () => {
    const error = new OrderInvalidTransitionError('delivered', 'preparing')

    expect(error).toBeInstanceOf(DomainError)
    expect(error.code).toBe('order.invalid_transition')
    expect(error.name).toBe('OrderInvalidTransitionError')
    expect(error.message).toBe('Cannot change order from delivered to preparing')
  })
})
