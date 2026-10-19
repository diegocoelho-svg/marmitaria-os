import { randomUUID } from 'node:crypto'
import { adjustmentSchema } from '@marmitaria/contracts'
import { describe, expect, it } from 'vitest'
import { useTestApp } from '@test/integration/test-app'

describe('/api/adjustments', () => {
  const { app } = useTestApp()

  it('creates, lists and updates adjustments', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/adjustments',
      payload: { label: 'Sem farofa' },
    })
    const semFarofa = adjustmentSchema.parse(created.json())
    await app.inject({
      method: 'POST',
      url: '/api/adjustments',
      payload: { label: 'Farofa → salada' },
    })

    const updated = await app.inject({
      method: 'PATCH',
      url: `/api/adjustments/${semFarofa.id}`,
      payload: { active: false },
    })
    const list = await app.inject({ method: 'GET', url: '/api/adjustments' })

    expect(created.statusCode).toBe(201)
    expect(updated.json()).toEqual({ ...semFarofa, active: false })
    expect(list.json()).toEqual([
      expect.objectContaining({ label: 'Farofa → salada', active: true }),
      { ...semFarofa, active: false },
    ])
  })

  it('answers errors with their codes', async () => {
    const invalid = await app.inject({
      method: 'POST',
      url: '/api/adjustments',
      payload: { label: 'x'.repeat(61) },
    })
    const missing = await app.inject({
      method: 'PATCH',
      url: `/api/adjustments/${randomUUID()}`,
      payload: { active: false },
    })

    expect(invalid.statusCode).toBe(422)
    expect(invalid.json()).toMatchObject({ code: 'adjustment.invalid_label' })
    expect(missing.statusCode).toBe(404)
    expect(missing.json()).toMatchObject({ code: 'adjustment.not_found' })
  })
})
