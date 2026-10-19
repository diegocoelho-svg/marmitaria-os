import { beforeEach, describe, expect, it } from 'vitest'
import { DishNotFoundError } from '@/application/errors/dish-not-found.error'
import { UpdateDishUseCase } from '@/application/use-cases/dishes/update-dish-use-case'
import { DishEntity } from '@/domain/entities/dish-entity'
import { DishInvalidNameError } from '@/domain/errors/dish-invalid-name.error'
import { FakeDishRepository } from '@test/fakes/fake-repositories'

describe('UpdateDishUseCase', () => {
  let dishes: FakeDishRepository
  let useCase: UpdateDishUseCase

  beforeEach(async () => {
    dishes = new FakeDishRepository()
    useCase = new UpdateDishUseCase(dishes)
    await dishes.create(
      DishEntity.create({ id: 'frango', name: 'Frango grelhado', description: 'Com legumes' }),
    )
  })

  it('changes only the informed fields', async () => {
    const output = await useCase.execute({ id: 'frango', name: 'Frango assado' })

    expect(output).toEqual({
      id: 'frango',
      name: 'Frango assado',
      description: 'Com legumes',
      active: true,
    })
    expect(await dishes.findById('frango')).toMatchObject({ name: 'Frango assado' })
  })

  it('clears the description with null and toggles availability', async () => {
    await useCase.execute({ id: 'frango', description: null, active: false })

    expect(await dishes.findById('frango')).toMatchObject({
      description: undefined,
      active: false,
    })

    await useCase.execute({ id: 'frango', active: true })

    expect(await dishes.findById('frango')).toMatchObject({ active: true })
  })

  it('rejects an unknown dish', async () => {
    await expect(useCase.execute({ id: 'peixe', name: 'Peixe' })).rejects.toBeInstanceOf(
      DishNotFoundError,
    )
  })

  it('keeps the stored dish when a field is invalid', async () => {
    await expect(
      useCase.execute({ id: 'frango', active: false, name: ' ' }),
    ).rejects.toBeInstanceOf(DishInvalidNameError)
    expect(await dishes.findById('frango')).toMatchObject({
      name: 'Frango grelhado',
      active: true,
    })
  })
})
