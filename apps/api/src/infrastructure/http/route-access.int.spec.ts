import { dishSchema, menuSchema, orderSchema } from '@marmitaria/contracts'
import { beforeEach, describe, expect, it } from 'vitest'
import { useTestApp } from '@test/integration/test-app'

describe('route access', () => {
  const { app, inject, clock } = useTestApp()
  let frango: string

  beforeEach(async () => {
    clock.set('2026-10-17T15:00:00Z')
    const dish = await inject({
      method: 'POST',
      url: '/api/dishes',
      payload: { name: 'Frango grelhado' },
    })
    frango = dishSchema.parse(dish.json()).id
    await inject({ method: 'PUT', url: '/api/size-prices/medium', payload: { priceCents: 2500 } })
    const menu = await inject({
      method: 'POST',
      url: '/api/menus',
      payload: { name: 'Cardápio A', dishIds: [frango] },
    })
    await inject({
      method: 'PUT',
      url: '/api/daily-menus/2026-10-17',
      payload: { menuId: menuSchema.parse(menu.json()).id },
    })
  })

  it('keeps everything but the health check behind a session', async () => {
    const health = await app.inject({ method: 'GET', url: '/api/health' })
    const dishes = await app.inject({ method: 'GET', url: '/api/dishes' })
    const orders = await app.inject({ method: 'POST', url: '/api/orders', payload: {} })

    expect(health.statusCode).toBe(200)
    expect(dishes.statusCode).toBe(401)
    expect(orders.statusCode).toBe(401)
  })

  it('lets the staff take orders and move them along', async () => {
    const created = await inject(
      {
        method: 'POST',
        url: '/api/orders',
        payload: { origin: 'counter', items: [{ dishId: frango, size: 'medium', quantity: 1 }] },
      },
      'staff',
    )
    const order = orderSchema.parse(created.json())
    const started = await inject(
      { method: 'PATCH', url: `/api/orders/${order.id}/status`, payload: { status: 'preparing' } },
      'staff',
    )
    const queue = await inject({ method: 'GET', url: '/api/orders' }, 'staff')
    const today = await inject({ method: 'GET', url: '/api/daily-menus/today' }, 'staff')

    expect(created.statusCode).toBe(201)
    expect(started.statusCode).toBe(200)
    expect(queue.statusCode).toBe(200)
    expect(today.statusCode).toBe(200)
  })

  it('keeps the catalog changes for administrators', async () => {
    const attempts = await Promise.all([
      inject({ method: 'POST', url: '/api/dishes', payload: { name: 'Bife' } }, 'staff'),
      inject(
        { method: 'PATCH', url: `/api/dishes/${frango}`, payload: { active: false } },
        'staff',
      ),
      inject({ method: 'POST', url: '/api/adjustments', payload: { label: 'Sem sal' } }, 'staff'),
      inject(
        { method: 'PUT', url: '/api/size-prices/medium', payload: { priceCents: 3000 } },
        'staff',
      ),
      inject(
        { method: 'POST', url: '/api/menus', payload: { name: 'B', dishIds: [frango] } },
        'staff',
      ),
      inject(
        {
          method: 'PUT',
          url: '/api/daily-menus/2026-10-17/dishes',
          payload: { dishIds: [frango] },
        },
        'staff',
      ),
    ])

    expect(attempts.map((response) => response.statusCode)).toEqual([403, 403, 403, 403, 403, 403])
    expect(attempts[0]?.json()).toMatchObject({ code: 'auth.forbidden' })
  })
})
