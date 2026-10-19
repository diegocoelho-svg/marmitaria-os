import { beforeEach, describe, expect, it } from 'vitest'
import { DishUnavailableError } from '@/application/errors/dish-unavailable.error'
import { MenuNameTakenError } from '@/application/errors/menu-name-taken.error'
import { MenuNotFoundError } from '@/application/errors/menu-not-found.error'
import { UpdateMenuUseCase } from '@/application/use-cases/menus/update-menu-use-case'
import { DishEntity } from '@/domain/entities/dish-entity'
import { MenuEntity } from '@/domain/entities/menu-entity'
import { MenuArchivedError } from '@/domain/errors/menu-archived.error'
import { FakeDishRepository, FakeMenuRepository } from '@test/fakes/fake-repositories'

describe('UpdateMenuUseCase', () => {
  let menus: FakeMenuRepository
  let useCase: UpdateMenuUseCase

  beforeEach(async () => {
    const dishes = new FakeDishRepository()
    menus = new FakeMenuRepository()
    useCase = new UpdateMenuUseCase(menus, dishes)

    const lasanha = DishEntity.create({ id: 'lasanha', name: 'Lasanha' })
    lasanha.deactivate()
    await dishes.create(DishEntity.create({ id: 'frango', name: 'Frango grelhado' }))
    await dishes.create(DishEntity.create({ id: 'peixe', name: 'Peixe assado' }))
    await dishes.create(lasanha)
    await menus.create(MenuEntity.create({ id: 'a', name: 'Cardápio A', dishIds: ['frango'] }))
    await menus.create(MenuEntity.create({ id: 'b', name: 'Cardápio B', dishIds: ['peixe'] }))
  })

  it('renames and replaces the dishes', async () => {
    const output = await useCase.execute({ id: 'a', name: 'Verão', dishIds: ['peixe', 'frango'] })

    expect(output).toMatchObject({ name: 'Verão', dishIds: ['peixe', 'frango'] })
    expect(await menus.findById('a')).toMatchObject({ name: 'Verão' })
  })

  it('accepts keeping its own name with another case', async () => {
    await expect(useCase.execute({ id: 'a', name: 'CARDÁPIO A' })).resolves.toMatchObject({
      name: 'CARDÁPIO A',
    })
  })

  it('rejects the name of another active menu', async () => {
    await expect(useCase.execute({ id: 'a', name: 'cardápio b' })).rejects.toBeInstanceOf(
      MenuNameTakenError,
    )
    expect(await menus.findById('a')).toMatchObject({ name: 'Cardápio A' })
  })

  it('rejects unavailable dishes', async () => {
    await expect(useCase.execute({ id: 'a', dishIds: ['lasanha'] })).rejects.toBeInstanceOf(
      DishUnavailableError,
    )
    expect(await menus.findById('a')).toMatchObject({ dishIds: ['frango'] })
  })

  it('rejects editing an archived menu', async () => {
    const archived = MenuEntity.create({ id: 'c', name: 'Cardápio C', dishIds: ['frango'] })
    archived.archive(new Date('2026-10-17T15:00:00Z'))
    await menus.create(archived)

    await expect(useCase.execute({ id: 'c', name: 'Outro' })).rejects.toBeInstanceOf(
      MenuArchivedError,
    )
  })

  it('rejects an unknown menu', async () => {
    await expect(useCase.execute({ id: 'z', name: 'Outro' })).rejects.toBeInstanceOf(
      MenuNotFoundError,
    )
  })
})
