import { describe, expect, it } from 'vitest'
import { PgSizePriceRepository } from '@/infrastructure/database/postgresql/pg-size-price-repository'
import { useTestApp } from '@test/integration/test-app'

describe('/api/size-prices', () => {
  const { app, db, clock } = useTestApp()
  const sizePrices = new PgSizePriceRepository(db)

  const change = (size: string, priceCents: number) =>
    app.inject({ method: 'PUT', url: `/api/size-prices/${size}`, payload: { priceCents } })

  it('lists the current price of each priced size', async () => {
    clock.set('2026-10-01T12:00:00Z')
    await change('medium', 2000)
    await change('large', 2500)

    const response = await app.inject({ method: 'GET', url: '/api/size-prices' })

    expect(response.json()).toEqual([
      { size: 'medium', priceCents: 2000, validFrom: '2026-10-01T12:00:00.000Z' },
      { size: 'large', priceCents: 2500, validFrom: '2026-10-01T12:00:00.000Z' },
    ])
  })

  it('closes the current price and opens the new one in one transaction', async () => {
    clock.set('2026-10-01T12:00:00Z')
    await change('medium', 2000)
    clock.set('2026-10-17T15:00:00Z')

    const response = await change('medium', 2200)

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      size: 'medium',
      priceCents: 2200,
      validFrom: '2026-10-17T15:00:00.000Z',
    })
    expect(await sizePrices.findValidAt('medium', new Date('2026-10-17T14:59:59Z'))).toMatchObject({
      price: { cents: 2000 },
      validTo: new Date('2026-10-17T15:00:00Z'),
    })
  })

  it('rejects an unknown size or a non-positive price', async () => {
    const unknownSize = await change('huge', 2000)
    const zero = await change('small', 0)

    expect(unknownSize.statusCode).toBe(400)
    expect(zero.statusCode).toBe(400)
  })
})
