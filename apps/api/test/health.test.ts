import { healthResponseSchema } from '@marmitaria/contracts'
import { afterAll, describe, expect, it } from 'vitest'
import { buildApp } from '../src/infra/http/app'

describe('GET /api/health', () => {
  const app = buildApp()

  afterAll(() => app.close())

  it('responds with ok status', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/health' })

    expect(response.statusCode).toBe(200)
    expect(healthResponseSchema.parse(response.json())).toEqual({ status: 'ok' })
  })
})
