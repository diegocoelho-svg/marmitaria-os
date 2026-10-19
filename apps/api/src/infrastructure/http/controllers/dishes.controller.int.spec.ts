import { randomUUID } from 'node:crypto'
import { dishSchema } from '@marmitaria/contracts'
import { describe, expect, it } from 'vitest'
import { useTestApp } from '@test/integration/test-app'

describe('/api/dishes', () => {
  const { app } = useTestApp()

  const create = async (payload: object) => {
    const response = await app.inject({ method: 'POST', url: '/api/dishes', payload })

    return dishSchema.parse(response.json())
  }

  it('creates, reads and lists dishes', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/dishes',
      payload: { name: 'Frango grelhado', description: 'Com legumes' },
    })
    const frango = dishSchema.parse(response.json())
    await create({ name: 'Bife acebolado' })

    expect(response.statusCode).toBe(201)
    expect(frango).toMatchObject({
      name: 'Frango grelhado',
      description: 'Com legumes',
      active: true,
    })

    const found = await app.inject({ method: 'GET', url: `/api/dishes/${frango.id}` })
    expect(found.json()).toEqual(frango)

    const list = await app.inject({ method: 'GET', url: '/api/dishes' })
    expect(list.json()).toMatchObject([{ name: 'Bife acebolado' }, { name: 'Frango grelhado' }])
  })

  it('updates only the informed fields', async () => {
    const frango = await create({ name: 'Frango grelhado', description: 'Com legumes' })

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/dishes/${frango.id}`,
      payload: { description: null, active: false },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ ...frango, description: null, active: false })
  })

  it('answers domain, lookup and format errors with their codes', async () => {
    const invalid = await app.inject({ method: 'POST', url: '/api/dishes', payload: { name: ' ' } })
    const missing = await app.inject({ method: 'GET', url: `/api/dishes/${randomUUID()}` })
    const malformed = await app.inject({ method: 'GET', url: '/api/dishes/frango' })

    expect(invalid.statusCode).toBe(422)
    expect(invalid.json()).toMatchObject({ code: 'dish.invalid_name' })
    expect(missing.statusCode).toBe(404)
    expect(missing.json()).toMatchObject({ code: 'dish.not_found' })
    expect(malformed.statusCode).toBe(400)
    expect(malformed.json()).toMatchObject({ code: 'request.invalid' })
  })
})
