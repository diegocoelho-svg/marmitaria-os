import { DishUnavailableError } from '@/application/errors/dish-unavailable.error'
import type { DishRepository } from '@/domain/repositories/dish-repository'

export async function ensureDishesAvailable(
  dishes: DishRepository,
  ids: readonly string[],
): Promise<void> {
  const found = await dishes.findByIds(ids)
  const available = new Set(found.filter((dish) => dish.active).map((dish) => dish.id))
  const unavailable = ids.filter((id) => !available.has(id))

  if (unavailable.length > 0) {
    throw new DishUnavailableError(unavailable)
  }
}
