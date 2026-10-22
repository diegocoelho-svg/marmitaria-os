import { healthResponseSchema } from '@marmitaria/contracts'
import { afterAll, describe, expect, it } from 'vitest'
import { buildApp } from '@/infrastructure/http/app'
import { HealthController } from '@/infrastructure/http/controllers/health.controller'

describe('GET /api/health', () => {
  const app = buildApp({
    controllers: [new HealthController()],
    guard: async () => {
      throw new Error('The health check must stay public')
    },
  })

  afterAll(() => app.close())

  it('responds with ok status', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/health' })

    expect(response.statusCode).toBe(200)
    expect(healthResponseSchema.parse(response.json())).toEqual({ status: 'ok' })
  })
})
