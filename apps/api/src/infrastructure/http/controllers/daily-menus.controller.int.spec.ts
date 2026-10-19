import { randomUUID } from 'node:crypto'
import { dailyMenuSchema, dishSchema, menuSchema } from '@marmitaria/contracts'
import { beforeEach, describe, expect, it } from 'vitest'
import type { ApplicationEvent } from '@/application/ports/event-bus'
import { useTestApp } from '@test/integration/test-app'

describe('/api/daily-menus', () => {
  const { app, clock, eventBus } = useTestApp()
  let frango: string
  let peixe: string
  let cardapioA: string
  let cardapioB: string

  const createDish = async (name: string) => {
    const response = await app.inject({ method: 'POST', url: '/api/dishes', payload: { name } })

    return dishSchema.parse(response.json()).id
  }

  const createMenu = async (name: string, dishIds: string[]) => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/menus',
      payload: { name, dishIds },
    })

    return menuSchema.parse(response.json()).id
  }

  const apply = (date: string, menuId: string) =>
    app.inject({ method: 'PUT', url: `/api/daily-menus/${date}`, payload: { menuId } })

  beforeEach(async () => {
    clock.set('2026-10-17T15:00:00Z')
    frango = await createDish('Frango grelhado')
    peixe = await createDish('Peixe assado')
    cardapioA = await createMenu('Cardápio A', [frango])
    cardapioB = await createMenu('Cardápio B', [peixe])
  })

  it('publishes a daily menu from a menu and replaces it when another is applied', async () => {
    const events: ApplicationEvent[] = []
    const unsubscribe = eventBus.subscribe((event) => {
      events.push(event)
    })

    const published = dailyMenuSchema.parse((await apply('2026-10-20', cardapioA)).json())
    const replaced = await apply('2026-10-20', cardapioB)
    unsubscribe()

    expect(published).toMatchObject({
      date: '2026-10-20',
      sourceMenuId: cardapioA,
      dishIds: [frango],
    })
    expect(replaced.json()).toEqual({ ...published, sourceMenuId: cardapioB, dishIds: [peixe] })
    expect(events.map((event) => event.type)).toEqual([
      'daily_menu.published',
      'daily_menu.updated',
    ])
  })

  it('adjusts the dishes of the day', async () => {
    await apply('2026-10-20', cardapioA)

    const response = await app.inject({
      method: 'PUT',
      url: '/api/daily-menus/2026-10-20/dishes',
      payload: { dishIds: [peixe, frango] },
    })

    expect(response.json()).toMatchObject({ sourceMenuId: cardapioA, dishIds: [peixe, frango] })
  })

  it('finds the daily menu of today, of a date and of a period', async () => {
    await apply('2026-10-17', cardapioA)
    await apply('2026-10-20', cardapioB)
    await apply('2026-10-25', cardapioA)

    const today = await app.inject({ method: 'GET', url: '/api/daily-menus/today' })
    const byDate = await app.inject({ method: 'GET', url: '/api/daily-menus/2026-10-20' })
    const period = await app.inject({
      method: 'GET',
      url: '/api/daily-menus?from=2026-10-17&to=2026-10-20',
    })

    expect(today.json()).toMatchObject({ date: '2026-10-17', sourceMenuId: cardapioA })
    expect(byDate.json()).toMatchObject({ date: '2026-10-20', sourceMenuId: cardapioB })
    expect(period.json()).toMatchObject([{ date: '2026-10-17' }, { date: '2026-10-20' }])
  })

  it('answers errors with their codes', async () => {
    const past = await apply('2026-10-16', cardapioA)
    const unknownMenu = await apply('2026-10-20', randomUUID())
    const missing = await app.inject({ method: 'GET', url: '/api/daily-menus/2026-10-21' })
    const noToday = await app.inject({ method: 'GET', url: '/api/daily-menus/today' })
    const badPeriod = await app.inject({
      method: 'GET',
      url: '/api/daily-menus?from=2026-10-20&to=2026-10-17',
    })
    const badDate = await app.inject({ method: 'GET', url: '/api/daily-menus/2026-02-30' })

    expect(past.statusCode).toBe(422)
    expect(past.json()).toMatchObject({ code: 'daily_menu.past_date' })
    expect(unknownMenu.statusCode).toBe(404)
    expect(missing.statusCode).toBe(404)
    expect(missing.json()).toMatchObject({ code: 'daily_menu.not_found' })
    expect(noToday.statusCode).toBe(404)
    expect(badPeriod.statusCode).toBe(400)
    expect(badDate.statusCode).toBe(400)
  })
})
