import type { CreateOrderItemInput } from '@/application/dtos/orders/create-order-input'
import { AdjustmentUnavailableError } from '@/application/errors/adjustment-unavailable.error'
import { OrderDishUnavailableError } from '@/application/errors/order-dish-unavailable.error'
import { OrderSizeNotPricedError } from '@/application/errors/order-size-not-priced.error'
import { OrderWithoutDailyMenuError } from '@/application/errors/order-without-daily-menu.error'
import type { Repositories } from '@/application/ports/unit-of-work'
import type { AdjustmentEntity } from '@/domain/entities/adjustment-entity'
import type { DishEntity } from '@/domain/entities/dish-entity'
import type { LocalDateVO } from '@/domain/value-objects/local-date-vo'
import type { MoneyVO } from '@/domain/value-objects/money-vo'
import { OrderItemVO } from '@/domain/value-objects/order-item-vo'
import type { Size } from '@/domain/value-objects/size'

type CatalogRepositories = Pick<
  Repositories,
  'dailyMenus' | 'dishes' | 'adjustments' | 'sizePrices'
>

export async function buildOrderItems(
  repositories: CatalogRepositories,
  items: readonly CreateOrderItemInput[],
  businessDate: LocalDateVO,
  now: Date,
): Promise<OrderItemVO[]> {
  const dishes = await availableDishes(repositories, items, businessDate)
  const adjustments = await availableAdjustments(repositories, items)
  const prices = await currentPrices(repositories, items, now)

  return items.map((item) => {
    const dish = dishes.get(item.dishId)
    const price = prices.get(item.size)

    if (!dish) {
      throw new OrderDishUnavailableError([item.dishId])
    }

    if (!price) {
      throw new OrderSizeNotPricedError(item.size)
    }

    return OrderItemVO.create({
      dishId: dish.id,
      dishName: dish.name,
      size: item.size,
      unitPrice: price,
      quantity: item.quantity,
      adjustments: (item.adjustmentIds ?? []).map((adjustmentId) => {
        const adjustment = adjustments.get(adjustmentId)

        if (!adjustment) {
          throw new AdjustmentUnavailableError([adjustmentId])
        }

        return { adjustmentId, label: adjustment.label }
      }),
      note: item.note,
    })
  })
}

async function availableDishes(
  { dailyMenus, dishes }: CatalogRepositories,
  items: readonly CreateOrderItemInput[],
  businessDate: LocalDateVO,
): Promise<Map<string, DishEntity>> {
  const dailyMenu = await dailyMenus.findByDate(businessDate)

  if (!dailyMenu) {
    throw new OrderWithoutDailyMenuError(businessDate.toString())
  }

  const ids = unique(items.map((item) => item.dishId))
  const found = await dishes.findByIds(ids)
  const available = new Map(
    found
      .filter((dish) => dish.active && dailyMenu.dishIds.includes(dish.id))
      .map((dish) => [dish.id, dish]),
  )
  const unavailable = ids.filter((id) => !available.has(id))

  if (unavailable.length > 0) {
    throw new OrderDishUnavailableError(unavailable)
  }

  return available
}

async function availableAdjustments(
  { adjustments }: CatalogRepositories,
  items: readonly CreateOrderItemInput[],
): Promise<Map<string, AdjustmentEntity>> {
  const ids = unique(items.flatMap((item) => item.adjustmentIds ?? []))
  const found = await adjustments.findByIds(ids)
  const available = new Map(
    found
      .filter((adjustment) => adjustment.active)
      .map((adjustment) => [adjustment.id, adjustment]),
  )
  const unavailable = ids.filter((id) => !available.has(id))

  if (unavailable.length > 0) {
    throw new AdjustmentUnavailableError(unavailable)
  }

  return available
}

async function currentPrices(
  { sizePrices }: CatalogRepositories,
  items: readonly CreateOrderItemInput[],
  now: Date,
): Promise<Map<Size, MoneyVO>> {
  const prices = new Map<Size, MoneyVO>()

  for (const size of unique(items.map((item) => item.size))) {
    const price = await sizePrices.findValidAt(size, now)

    if (!price) {
      throw new OrderSizeNotPricedError(size)
    }

    prices.set(size, price.price)
  }

  return prices
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)]
}
