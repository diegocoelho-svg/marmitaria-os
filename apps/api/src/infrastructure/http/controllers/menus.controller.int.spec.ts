import { randomUUID } from 'node:crypto'
import { dishSchema, menuSchema } from '@marmitaria/contracts'
import { beforeEach, describe, expect, it } from 'vitest'
import { useTestApp } from '@test/integration/test-app'

describe('/api/menus', () => {
  const { inject } = useTestApp()
  let frango: string
  let bife: string

  const createDish = async (name: string) => {
    const response = await inject({ method: 'POST', url: '/api/dishes', payload: { name } })

    return dishSchema.parse(response.json()).id
  }

  const createMenu = (name: string, dishIds: string[]) =>
    inject({ method: 'POST', url: '/api/menus', payload: { name, dishIds } })

  beforeEach(async () => {
    frango = await createDish('Frango grelhado')
    bife = await createDish('Bife acebolado')
  })

  it('creates, reads, edits and lists menus', async () => {
    const created = await createMenu('Cardápio A', [bife, frango])
    const menu = menuSchema.parse(created.json())

    const edited = await inject({
      method: 'PATCH',
      url: `/api/menus/${menu.id}`,
      payload: { name: 'Cardápio de verão', dishIds: [frango] },
    })
    const found = await inject({ method: 'GET', url: `/api/menus/${menu.id}` })
    const list = await inject({ method: 'GET', url: '/api/menus' })

    expect(created.statusCode).toBe(201)
    expect(menu).toMatchObject({ name: 'Cardápio A', dishIds: [bife, frango], archivedAt: null })
    expect(edited.json()).toEqual({ ...menu, name: 'Cardápio de verão', dishIds: [frango] })
    expect(found.json()).toEqual(edited.json())
    expect(list.json()).toEqual([edited.json()])
  })

  it('accepts dish ids in uppercase', async () => {
    const created = await createMenu('Cardápio A', [frango.toUpperCase()])

    expect(created.statusCode).toBe(201)
    expect(created.json()).toMatchObject({ dishIds: [frango] })
  })

  it('archives a menu, hides it from the list and frees its name', async () => {
    const menu = menuSchema.parse((await createMenu('Cardápio A', [frango])).json())

    const archived = await inject({ method: 'POST', url: `/api/menus/${menu.id}/archive` })
    const list = await inject({ method: 'GET', url: '/api/menus' })
    const reused = await createMenu('Cardápio A', [bife])
    const edit = await inject({
      method: 'PATCH',
      url: `/api/menus/${menu.id}`,
      payload: { name: 'Outro' },
    })

    expect(archived.json()).toMatchObject({ archivedAt: '2026-10-17T15:00:00.000Z' })
    expect(list.json()).toEqual([])
    expect(reused.statusCode).toBe(201)
    expect(edit.statusCode).toBe(422)
    expect(edit.json()).toMatchObject({ code: 'menu.archived' })
  })

  it('rejects a duplicate active name and unavailable dishes', async () => {
    await createMenu('Cardápio A', [frango])

    const duplicate = await createMenu('cardápio a', [bife])
    const unknownDish = await createMenu('Cardápio B', [randomUUID()])
    const missing = await inject({ method: 'GET', url: `/api/menus/${randomUUID()}` })

    expect(duplicate.statusCode).toBe(409)
    expect(duplicate.json()).toMatchObject({ code: 'menu.name_taken' })
    expect(unknownDish.statusCode).toBe(422)
    expect(unknownDish.json()).toMatchObject({ code: 'dish.unavailable' })
    expect(missing.statusCode).toBe(404)
  })
})
