import { describe, expect, it } from 'vitest'
import { Order, type OrderOrigin } from '../../../src/domain/entities/order'
import { LocalDate } from '../../../src/domain/value-objects/local-date'
import { Money } from '../../../src/domain/value-objects/money'
import { OrderItem } from '../../../src/domain/value-objects/order-item'
import type { OrderStatus } from '../../../src/domain/value-objects/order-status'
import { TicketNumber } from '../../../src/domain/value-objects/ticket-number'

const createdAt = new Date('2026-10-10T15:00:00Z')
const businessDate = LocalDate.parse('2026-10-10')

function at(minutes: number) {
  return new Date(createdAt.getTime() + minutes * 60_000)
}

function item(quantity = 1, cents = 2200) {
  return OrderItem.create({
    dishId: 'frango',
    dishName: 'Frango grelhado',
    size: 'large',
    unitPrice: Money.fromCents(cents),
    quantity,
  })
}

function newOrder() {
  const order = Order.create({
    id: 'order-1',
    businessDate,
    ticket: TicketNumber.of(42),
    origin: 'counter',
    items: [item()],
    now: createdAt,
  })
  order.pullEvents()
  return order
}

const restoreBase = {
  id: 'order-1',
  businessDate,
  ticket: TicketNumber.of(42),
  origin: 'counter',
  items: [item()],
  createdAt,
} as const

describe('Order', () => {
  it('is created as received and records OrderCreated', () => {
    const order = Order.create({
      id: 'order-1',
      businessDate,
      ticket: TicketNumber.of(42),
      origin: 'whatsapp',
      customerName: '  Maria ',
      items: [item()],
      now: createdAt,
    })

    expect(order.status).toBe('received')
    expect(order.customerName).toBe('Maria')
    expect(order.pullEvents()).toEqual([
      {
        type: 'order.created',
        aggregateId: 'order-1',
        occurredAt: createdAt,
        businessDate: '2026-10-10',
        ticket: 42,
      },
    ])
  })

  it('requires at least one item', () => {
    expect(() =>
      Order.create({
        id: 'order-1',
        businessDate,
        ticket: TicketNumber.of(1),
        origin: 'counter',
        items: [],
        now: createdAt,
      }),
    ).toThrow(expect.objectContaining({ code: 'order.empty' }))
  })

  it('requires the business date of its creation instant', () => {
    expect(() =>
      Order.create({
        id: 'order-1',
        businessDate: LocalDate.parse('2026-10-11'),
        ticket: TicketNumber.of(1),
        origin: 'counter',
        items: [item()],
        now: createdAt,
      }),
    ).toThrow(expect.objectContaining({ code: 'order.business_date_mismatch' }))
  })

  it('sums item subtotals', () => {
    const order = Order.create({
      id: 'order-1',
      businessDate,
      ticket: TicketNumber.of(1),
      origin: 'counter',
      items: [item(2, 2200), item(1, 1800)],
      now: createdAt,
    })

    expect(order.total().cents).toBe(6200)
  })

  it('rejects a total beyond the safe integer range', () => {
    expect(() =>
      Order.create({
        id: 'order-1',
        businessDate,
        ticket: TicketNumber.of(1),
        origin: 'counter',
        items: [item(Number.MAX_SAFE_INTEGER, 1), item(1, 1)],
        now: createdAt,
      }),
    ).toThrow(expect.objectContaining({ code: 'money.invalid_amount' }))
  })

  it('goes through the kitchen flow recording each moment', () => {
    const order = newOrder()

    order.start(at(1))
    order.markReady(at(12))
    order.deliver(at(15))

    expect(order.status).toBe('delivered')
    expect(order.startedAt).toEqual(at(1))
    expect(order.readyAt).toEqual(at(12))
    expect(order.deliveredAt).toEqual(at(15))
    expect(order.pullEvents().map((event) => event.type)).toEqual([
      'order.started',
      'order.ready',
      'order.delivered',
    ])
  })

  it.each([
    ['markReady', []],
    ['deliver', ['start']],
    ['start', ['start']],
  ] as const)('rejects %s after %j', (action, previous) => {
    const order = newOrder()
    for (const step of previous) order[step](at(1))
    order.pullEvents()

    expect(() => order[action](at(2))).toThrow(
      expect.objectContaining({ code: 'order.invalid_transition' }),
    )
    expect(order.pullEvents()).toEqual([])
  })

  it.each([[[]], [['start']], [['start', 'markReady']]] as const)(
    'can be cancelled after %j',
    (previous) => {
      const order = newOrder()
      for (const step of previous) order[step](at(1))

      order.cancel(at(5))

      expect(order.status).toBe('cancelled')
      expect(order.cancelledAt).toEqual(at(5))
    },
  )

  it('cannot change after being delivered or cancelled', () => {
    const delivered = newOrder()
    delivered.start(at(1))
    delivered.markReady(at(2))
    delivered.deliver(at(3))

    const cancelled = newOrder()
    cancelled.cancel(at(1))

    expect(() => delivered.cancel(at(4))).toThrow(
      expect.objectContaining({ code: 'order.invalid_transition' }),
    )
    expect(() => cancelled.start(at(2))).toThrow(
      expect.objectContaining({ code: 'order.invalid_transition' }),
    )
  })

  it('rejects a change earlier than the previous one and keeps its state', () => {
    const order = newOrder()
    order.start(at(10))

    expect(() => order.markReady(at(5))).toThrow(
      expect.objectContaining({ code: 'order.time_went_backwards' }),
    )
    expect(order.status).toBe('preparing')
    expect(order.readyAt).toBeUndefined()
  })

  it('does not expose its items or dates for mutation', () => {
    const order = newOrder()

    ;(order.items as OrderItem[]).push(item())
    order.createdAt.setFullYear(2030)

    expect(order.items).toHaveLength(1)
    expect(order.createdAt).toEqual(createdAt)
  })

  it('keeps its total when a shared price or item is tampered with', () => {
    const price = Money.fromCents(2200)
    const orderItem = OrderItem.create({
      dishId: 'frango',
      dishName: 'Frango grelhado',
      size: 'large',
      unitPrice: price,
      quantity: 1,
    })
    const order = Order.create({
      id: 'order-1',
      businessDate,
      ticket: TicketNumber.of(1),
      origin: 'counter',
      items: [orderItem],
      now: createdAt,
    })

    expect(() => Object.assign(price, { cents: 1 })).toThrow(TypeError)
    expect(() => Object.assign(orderItem, { quantity: 100 })).toThrow(TypeError)
    expect(order.total().cents).toBe(2200)
  })

  describe('restore', () => {
    it('rebuilds a delivered order without recording events', () => {
      const order = Order.restore({
        ...restoreBase,
        status: 'delivered',
        startedAt: at(1),
        readyAt: at(10),
        deliveredAt: at(12),
      })

      expect(order.status).toBe('delivered')
      expect(order.pullEvents()).toEqual([])
    })

    it('rebuilds an order from a previous day', () => {
      expect(() =>
        Order.restore({
          ...restoreBase,
          businessDate: LocalDate.parse('2026-01-05'),
          createdAt: new Date('2026-01-05T15:00:00Z'),
          status: 'received',
        }),
      ).not.toThrow()
    })

    it('rebuilds an order cancelled while ready', () => {
      expect(() =>
        Order.restore({
          ...restoreBase,
          status: 'cancelled',
          startedAt: at(1),
          readyAt: at(5),
          cancelledAt: at(8),
        }),
      ).not.toThrow()
    })

    it('rejects a business date other than the creation date', () => {
      expect(() =>
        Order.restore({
          ...restoreBase,
          businessDate: LocalDate.parse('2026-10-09'),
          status: 'received',
        }),
      ).toThrow(expect.objectContaining({ code: 'order.business_date_mismatch' }))
    })

    it('rejects an unknown origin or status', () => {
      expect(() =>
        Order.restore({ ...restoreBase, origin: 'phone' as OrderOrigin, status: 'received' }),
      ).toThrow(expect.objectContaining({ code: 'order.invalid_origin' }))
      expect(() => Order.restore({ ...restoreBase, status: 'archived' as OrderStatus })).toThrow(
        expect.objectContaining({ code: 'order.invalid_status' }),
      )
    })

    it('rejects a total beyond the safe integer range', () => {
      expect(() =>
        Order.restore({
          ...restoreBase,
          items: [item(Number.MAX_SAFE_INTEGER, 1), item(1, 1)],
          status: 'received',
        }),
      ).toThrow(expect.objectContaining({ code: 'money.invalid_amount' }))
    })

    it.each([
      ['ready without startedAt', { status: 'ready', readyAt: at(5) }],
      ['preparing with readyAt', { status: 'preparing', startedAt: at(1), readyAt: at(5) }],
      ['received with cancelledAt', { status: 'received', cancelledAt: at(1) }],
      [
        'cancelled after delivery',
        {
          status: 'cancelled',
          startedAt: at(1),
          readyAt: at(2),
          deliveredAt: at(3),
          cancelledAt: at(4),
        },
      ],
      ['timestamps out of order', { status: 'ready', startedAt: at(10), readyAt: at(5) }],
      ['started before creation', { status: 'preparing', startedAt: at(-1) }],
    ] as const)('rejects %s', (_, history) => {
      expect(() => Order.restore({ ...restoreBase, ...history })).toThrow(
        expect.objectContaining({ code: 'order.inconsistent_state' }),
      )
    })
  })
})
