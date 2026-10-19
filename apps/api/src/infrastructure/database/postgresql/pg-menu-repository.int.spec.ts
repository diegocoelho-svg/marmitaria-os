import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it } from 'vitest'
import { MenuEntity } from '@/domain/entities/menu-entity'
import { StaleWriteError } from '@/domain/errors/stale-write.error'
import { PgMenuRepository } from '@/infrastructure/database/postgresql/pg-menu-repository'
import { present, seedDish, violates } from '@test/integration/fixtures'
import { useTestDatabase } from '@test/integration/test-database'

describe('PgMenuRepository', () => {
  const db = useTestDatabase()
  const repository = new PgMenuRepository(db)
  let frango: string
  let bife: string
  let peixe: string

  beforeEach(async () => {
    frango = await seedDish(db, 'Frango grelhado')
    bife = await seedDish(db, 'Bife acebolado')
    peixe = await seedDish(db, 'Peixe assado')
  })

  const menu = (name: string, ids: readonly string[] = [frango, bife]) =>
    MenuEntity.create({ id: randomUUID(), name, dishIds: ids })

  it('round-trips a menu keeping the dish order', async () => {
    const cardapioA = menu('Cardápio A', [peixe, frango, bife])

    await repository.create(cardapioA)

    expect(await repository.findById(cardapioA.id)).toEqual(cardapioA)
  })

  it('returns null for an unknown id', async () => {
    expect(await repository.findById(randomUUID())).toBeNull()
  })

  it('lists only active menus by name', async () => {
    const cardapioB = menu('Cardápio B')
    const cardapioA = menu('Cardápio A')
    const archived = menu('Cardápio C')
    archived.archive(new Date())
    await repository.create(cardapioB)
    await repository.create(cardapioA)
    await repository.create(archived)

    expect(await repository.findAllActive()).toEqual([cardapioA, cardapioB])
  })

  it('checks active name keys ignoring archived menus and the menu itself', async () => {
    const cardapioA = menu('Cardápio A')
    const archived = menu('Cardápio B')
    archived.archive(new Date())
    await repository.create(cardapioA)
    await repository.create(archived)

    expect(await repository.existsActiveByNameKey(cardapioA.nameKey)).toBe(true)
    expect(await repository.existsActiveByNameKey(cardapioA.nameKey, cardapioA.id)).toBe(false)
    expect(await repository.existsActiveByNameKey(archived.nameKey)).toBe(false)
  })

  it('rejects an active menu whose name is Unicode-equivalent to another', async () => {
    await repository.create(menu('Café'))

    await expect(repository.create(menu('CAFÉ'))).rejects.toMatchObject(
      violates('menus_active_name_key_unique'),
    )
  })

  it('accepts the name of an archived menu', async () => {
    const archived = menu('Cardápio A')
    archived.archive(new Date())
    await repository.create(archived)

    await expect(repository.create(menu('Cardápio A'))).resolves.toBeUndefined()
  })

  it('persists renaming, new dishes and archiving', async () => {
    const cardapioA = menu('Cardápio A')
    await repository.create(cardapioA)

    cardapioA.rename('Cardápio de verão')
    cardapioA.setDishes([peixe, frango])
    await repository.update(cardapioA)
    expect(await repository.findById(cardapioA.id)).toEqual(cardapioA)

    cardapioA.archive(new Date())
    await repository.update(cardapioA)
    expect(await repository.findById(cardapioA.id)).toEqual(cardapioA)
  })

  it('rejects an update from a copy read before the menu was archived', async () => {
    const current = menu('Cardápio A')
    await repository.create(current)
    const stale = present(await repository.findById(current.id))

    current.archive(new Date())
    await repository.update(current)
    stale.rename('Cardápio B')
    stale.setDishes([peixe])

    await expect(repository.update(stale)).rejects.toBeInstanceOf(StaleWriteError)
    expect(await repository.findById(current.id)).toEqual(current)
  })

  it('rolls back the creation when a dish cannot be stored', async () => {
    const broken = menu('Cardápio A', [randomUUID()])

    await expect(repository.create(broken)).rejects.toMatchObject(
      violates('menu_dishes_dish_id_dishes_id_fk'),
    )
    expect(await repository.findById(broken.id)).toBeNull()
  })

  it('rolls back the update when a dish cannot be stored', async () => {
    const cardapioA = menu('Cardápio A')
    await repository.create(cardapioA)
    const stored = await repository.findById(cardapioA.id)

    cardapioA.rename('Cardápio B')
    cardapioA.setDishes([randomUUID()])

    await expect(repository.update(cardapioA)).rejects.toMatchObject(
      violates('menu_dishes_dish_id_dishes_id_fk'),
    )
    expect(await repository.findById(cardapioA.id)).toEqual(stored)
  })
})
