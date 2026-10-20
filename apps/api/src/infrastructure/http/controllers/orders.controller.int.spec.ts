import { randomUUID } from 'node:crypto'
import {
  adjustmentSchema,
  dishSchema,
  menuSchema,
  orderSchema,
  type CreateOrderBody,
} from '@marmitaria/contracts'
import { beforeEach, describe, expect, it } from 'vitest'
import type { ApplicationEvent } from '@/application/ports/event-bus'
import { useTestApp } from '@test/integration/test-app'

describe('/api/orders', () => {
  const { app, clock, eventBus } = useTestApp()
  let frango: string
  let semFarofa: string

  const post = async (url: string, payload: object) => {
    const response = await app.inject({ method: 'POST', url, payload })

    return response.json()
  }

  const createOrder = (payload: CreateOrderBody) =>
    app.inject({ method: 'POST', url: '/api/orders', payload })

  const changeStatus = (id: string, status: string) =>
    app.inject({ method: 'PATCH', url: `/api/orders/${id}/status`, payload: { status } })

  const counterOrder = (overrides: Partial<CreateOrderBody> = {}): CreateOrderBody => ({
    origin: 'counter',
    items: [{ dishId: frango, size: 'medium', quantity: 1 }],
    ...overrides,
  })

  beforeEach(async () => {
    clock.set('2026-10-17T15:00:00Z')
    frango = dishSchema.parse(await post('/api/dishes', { name: 'Frango grelhado' })).id
    semFarofa = adjustmentSchema.parse(await post('/api/adjustments', { label: 'Sem farofa' })).id
    await app.inject({
      method: 'PUT',
      url: '/api/size-prices/medium',
      payload: { priceCents: 2500 },
    })
    const menu = menuSchema.parse(
      await post('/api/menus', { name: 'Cardápio A', dishIds: [frango] }),
    )
    await app.inject({
      method: 'PUT',
      url: '/api/daily-menus/2026-10-17',
      payload: { menuId: menu.id },
    })
  })

  it('takes an order at the counter and follows it until delivery', async () => {
    const events: ApplicationEvent[] = []
    const unsubscribe = eventBus.subscribe((event) => {
      events.push(event)
    })

    const created = await createOrder(
      counterOrder({
        customerName: 'Maria',
        items: [
          {
            dishId: frango,
            size: 'medium',
            quantity: 2,
            adjustmentIds: [semFarofa],
            note: 'Sem sal',
          },
        ],
      }),
    )
    const order = orderSchema.parse(created.json())
    clock.set('2026-10-17T15:05:00Z')
    await changeStatus(order.id, 'preparing')
    clock.set('2026-10-17T15:20:00Z')
    await changeStatus(order.id, 'ready')
    clock.set('2026-10-17T15:25:00Z')
    const delivered = await changeStatus(order.id, 'delivered')
    const found = await app.inject({ method: 'GET', url: `/api/orders/${order.id}` })
    unsubscribe()

    expect(created.statusCode).toBe(201)
    expect(order).toMatchObject({
      ticket: 1,
      businessDate: '2026-10-17',
      status: 'received',
      customerName: 'Maria',
      totalCents: 5000,
      items: [
        {
          dishName: 'Frango grelhado',
          unitPriceCents: 2500,
          adjustments: [{ adjustmentId: semFarofa, label: 'Sem farofa' }],
          note: 'Sem sal',
        },
      ],
    })
    expect(delivered.json()).toMatchObject({
      status: 'delivered',
      startedAt: '2026-10-17T15:05:00.000Z',
      readyAt: '2026-10-17T15:20:00.000Z',
      deliveredAt: '2026-10-17T15:25:00.000Z',
    })
    expect(found.json()).toEqual(delivered.json())
    expect(events.map((event) => event.type)).toEqual([
      'order.created',
      'order.started',
      'order.ready',
      'order.delivered',
    ])
  })

  it('gives every concurrent order of the day its own ticket', async () => {
    const responses = await Promise.all(
      Array.from({ length: 10 }, () => createOrder(counterOrder())),
    )

    const tickets = responses.map((response) => orderSchema.parse(response.json()).ticket)

    expect(tickets.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('keeps the ticket sequence when an order is rejected', async () => {
    const rejected = await createOrder(counterOrder({ customerName: 'x'.repeat(61) }))
    const accepted = await createOrder(counterOrder())

    expect(rejected.statusCode).toBe(422)
    expect(rejected.json()).toMatchObject({ code: 'order.invalid_customer_name' })
    expect(accepted.json()).toMatchObject({ ticket: 1 })
  })

  it('accepts dish and adjustment ids in uppercase', async () => {
    const created = await createOrder(
      counterOrder({
        items: [
          {
            dishId: frango.toUpperCase(),
            size: 'medium',
            quantity: 1,
            adjustmentIds: [semFarofa.toUpperCase()],
          },
        ],
      }),
    )

    expect(created.statusCode).toBe(201)
    expect(created.json()).toMatchObject({
      items: [{ dishId: frango, adjustments: [{ adjustmentId: semFarofa }] }],
    })
  })

  it('answers errors with their codes', async () => {
    const order = orderSchema.parse((await createOrder(counterOrder())).json())

    const invalidTransition = await changeStatus(order.id, 'delivered')
    const unknownStatus = await changeStatus(order.id, 'received')
    const missing = await app.inject({ method: 'GET', url: `/api/orders/${randomUUID()}` })
    const unknownDish = await createOrder(
      counterOrder({ items: [{ dishId: randomUUID(), size: 'medium', quantity: 1 }] }),
    )
    const unpricedSize = await createOrder(
      counterOrder({ items: [{ dishId: frango, size: 'large', quantity: 1 }] }),
    )
    const empty = await createOrder(counterOrder({ items: [] }))
    clock.set('2026-10-18T15:00:00Z')
    const noDailyMenu = await createOrder(counterOrder())

    expect(invalidTransition.statusCode).toBe(422)
    expect(invalidTransition.json()).toMatchObject({ code: 'order.invalid_transition' })
    expect(unknownStatus.statusCode).toBe(400)
    expect(missing.statusCode).toBe(404)
    expect(missing.json()).toMatchObject({ code: 'order.not_found' })
    expect(unknownDish.json()).toMatchObject({ code: 'order.dish_unavailable' })
    expect(unpricedSize.json()).toMatchObject({ code: 'order.size_not_priced' })
    expect(empty.statusCode).toBe(400)
    expect(noDailyMenu.statusCode).toBe(422)
    expect(noDailyMenu.json()).toMatchObject({ code: 'order.no_daily_menu' })
  })
})
