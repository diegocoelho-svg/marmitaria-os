import { describe, expect, it } from 'vitest'
import { DishInvalidNameError } from '../../../src/domain/errors/dish-invalid-name.error'
import { DishEntity } from '../../../src/domain/entities/dish-entity'

describe('DishEntity', () => {
  it('is created active with a trimmed name', () => {
    const dish = DishEntity.create({ id: 'dish-1', name: '  Frango grelhado  ', description: ' ' })

    expect(dish.name).toBe('Frango grelhado')
    expect(dish.description).toBeUndefined()
    expect(dish.active).toBe(true)
  })

  it.each(['', '   ', 'x'.repeat(81)])('rejects the name %j', (name) => {
    expect(() => DishEntity.create({ id: 'dish-1', name })).toThrow(DishInvalidNameError)
  })

  it('renames, describes and toggles availability', () => {
    const dish = DishEntity.create({ id: 'dish-1', name: 'Lasanha' })

    dish.rename('Lasanha de carne')
    dish.describe('Molho bolonhesa')
    dish.deactivate()

    expect(dish.name).toBe('Lasanha de carne')
    expect(dish.description).toBe('Molho bolonhesa')
    expect(dish.active).toBe(false)

    dish.activate()
    expect(dish.active).toBe(true)
  })

  it('restores an inactive dish', () => {
    const dish = DishEntity.restore({ id: 'dish-1', name: 'Feijoada', active: false })

    expect(dish.active).toBe(false)
  })
})
