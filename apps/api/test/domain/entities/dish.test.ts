import { describe, expect, it } from 'vitest'
import { Dish } from '../../../src/domain/entities/dish'

describe('Dish', () => {
  it('is created active with a trimmed name', () => {
    const dish = Dish.create({ id: 'dish-1', name: '  Frango grelhado  ', description: ' ' })

    expect(dish.name).toBe('Frango grelhado')
    expect(dish.description).toBeUndefined()
    expect(dish.active).toBe(true)
  })

  it.each(['', '   ', 'x'.repeat(81)])('rejects the name %j', (name) => {
    expect(() => Dish.create({ id: 'dish-1', name })).toThrow(
      expect.objectContaining({ code: 'dish.invalid_name' }),
    )
  })

  it('renames, describes and toggles availability', () => {
    const dish = Dish.create({ id: 'dish-1', name: 'Lasanha' })

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
    const dish = Dish.restore({ id: 'dish-1', name: 'Feijoada', active: false })

    expect(dish.active).toBe(false)
  })
})
