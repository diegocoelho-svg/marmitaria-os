import { beforeEach, describe, expect, it } from 'vitest'
import { DishUnavailableError } from '@/application/errors/dish-unavailable.error'
import { MenuNameTakenError } from '@/application/errors/menu-name-taken.error'
import { CreateMenuUseCase } from '@/application/use-cases/menus/create-menu-use-case'
import { DishEntity } from '@/domain/entities/dish-entity'
import { MenuEmptyError } from '@/domain/errors/menu-empty.error'
import { FakeDishRepository, FakeMenuRepository } from '@test/fakes/fake-repositories'
import { SequentialIdGenerator } from '@test/fakes/fake-services'

describe('CreateMenuUseCase', () => {
  let menus: FakeMenuRepository
  let useCase: CreateMenuUseCase

  beforeEach(async () => {
    const dishes = new FakeDishRepository()
    menus = new FakeMenuRepository()
    useCase = new CreateMenuUseCase(menus, dishes, new SequentialIdGenerator())

    const lasanha = DishEntity.create({ id: 'lasanha', name: 'Lasanha' })
    lasanha.deactivate()
    await dishes.create(DishEntity.create({ id: 'frango', name: 'Frango grelhado' }))
    await dishes.create(DishEntity.create({ id: 'bife', name: 'Bife acebolado' }))
    await dishes.create(lasanha)
  })

  it('creates a menu keeping the dish order', async () => {
    const output = await useCase.execute({ name: ' Cardápio A ', dishIds: ['bife', 'frango'] })

    expect(output).toEqual({
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Cardápio A',
      dishIds: ['bife', 'frango'],
      archivedAt: null,
    })
    expect(await menus.findById(output.id)).toMatchObject({ dishIds: ['bife', 'frango'] })
  })

  it('rejects a name already used by an active menu, ignoring case', async () => {
    await useCase.execute({ name: 'Cardápio A', dishIds: ['frango'] })

    await expect(useCase.execute({ name: 'CARDÁPIO A', dishIds: ['bife'] })).rejects.toBeInstanceOf(
      MenuNameTakenError,
    )
  })

  it('rejects inactive or unknown dishes', async () => {
    const created = useCase.execute({ name: 'Cardápio A', dishIds: ['frango', 'lasanha', 'peixe'] })

    await expect(created).rejects.toBeInstanceOf(DishUnavailableError)
    await expect(created).rejects.toMatchObject({
      message: 'Dishes lasanha, peixe do not exist or are inactive',
    })
    expect(await menus.findAllActive()).toEqual([])
  })

  it('rejects a menu without dishes', async () => {
    await expect(useCase.execute({ name: 'Cardápio A', dishIds: [] })).rejects.toBeInstanceOf(
      MenuEmptyError,
    )
  })
})
