import { beforeEach, describe, expect, it } from 'vitest'
import type { CreateOrderInput } from '@/application/dtos/orders/create-order-input'
import { AdjustmentUnavailableError } from '@/application/errors/adjustment-unavailable.error'
import { OrderDishUnavailableError } from '@/application/errors/order-dish-unavailable.error'
import { OrderSizeNotPricedError } from '@/application/errors/order-size-not-priced.error'
import { OrderWithoutDailyMenuError } from '@/application/errors/order-without-daily-menu.error'
import { CreateOrderUseCase } from '@/application/use-cases/orders/create-order-use-case'
import { AdjustmentEntity } from '@/domain/entities/adjustment-entity'
import { DailyMenuEntity } from '@/domain/entities/daily-menu-entity'
import { DishEntity } from '@/domain/entities/dish-entity'
import { MenuEntity } from '@/domain/entities/menu-entity'
import { SizePriceEntity } from '@/domain/entities/size-price-entity'
import { OrderInvalidCustomerNameError } from '@/domain/errors/order-invalid-customer-name.error'
import { LocalDateVO } from '@/domain/value-objects/local-date-vo'
import { MoneyVO } from '@/domain/value-objects/money-vo'
import { fakeRepositories, type FakeRepositories } from '@test/fakes/fake-repositories'
import {
  FakeClock,
  FakeUnitOfWork,
  RecordingEventBus,
  SequentialIdGenerator,
} from '@test/fakes/fake-services'

describe('CreateOrderUseCase', () => {
  const now = new Date('2026-10-17T15:00:00Z')
  let repositories: FakeRepositories
  let clock: FakeClock
  let eventBus: RecordingEventBus
  let useCase: CreateOrderUseCase

  beforeEach(async () => {
    const fakes = fakeRepositories()
    repositories = fakes
    clock = new FakeClock(now)
    eventBus = new RecordingEventBus()
    useCase = new CreateOrderUseCase(
      new FakeUnitOfWork(fakes),
      clock,
      new SequentialIdGenerator(),
      eventBus,
    )

    const lasanha = DishEntity.create({ id: 'lasanha', name: 'Lasanha' })
    lasanha.deactivate()
    const semFeijao = AdjustmentEntity.create({ id: 'sem-feijao', label: 'Sem feijão' })
    semFeijao.deactivate()
    const menu = MenuEntity.create({
      id: 'menu-a',
      name: 'Cardápio A',
      dishIds: ['frango', 'lasanha'],
    })

    await fakes.dishes.create(DishEntity.create({ id: 'frango', name: 'Frango grelhado' }))
    await fakes.dishes.create(DishEntity.create({ id: 'bife', name: 'Bife acebolado' }))
    await fakes.dishes.create(lasanha)
    await fakes.adjustments.create(
      AdjustmentEntity.create({ id: 'sem-farofa', label: 'Sem farofa' }),
    )
    await fakes.adjustments.create(semFeijao)
    await fakes.sizePrices.create(
      SizePriceEntity.create({
        id: 'medium-price',
        size: 'medium',
        price: MoneyVO.fromCents(2500),
        validFrom: new Date('2026-10-01T12:00:00Z'),
      }),
    )
    await fakes.dailyMenus.create(
      DailyMenuEntity.fromMenu({ id: 'today', date: LocalDateVO.parse('2026-10-17'), menu, now }),
    )
  })

  it('creates an order with the snapshot of dish, price and adjustments', async () => {
    const output = await useCase.execute({
      origin: 'counter',
      customerName: 'Maria',
      items: [
        {
          dishId: 'frango',
          size: 'medium',
          quantity: 2,
          adjustmentIds: ['sem-farofa'],
          note: 'Bem passado',
        },
      ],
    })

    expect(output).toEqual({
      id: '00000000-0000-4000-8000-000000000001',
      businessDate: '2026-10-17',
      ticket: 1,
      origin: 'counter',
      customerName: 'Maria',
      status: 'received',
      items: [
        {
          dishId: 'frango',
          dishName: 'Frango grelhado',
          size: 'medium',
          unitPriceCents: 2500,
          quantity: 2,
          subtotalCents: 5000,
          adjustments: [{ adjustmentId: 'sem-farofa', label: 'Sem farofa' }],
          note: 'Bem passado',
        },
      ],
      totalCents: 5000,
      createdAt: '2026-10-17T15:00:00.000Z',
      startedAt: null,
      readyAt: null,
      deliveredAt: null,
      cancelledAt: null,
    })
    expect(await repositories.orders.findById(output.id)).not.toBeNull()
    expect(eventBus.published).toEqual([
      {
        type: 'order.created',
        aggregateId: output.id,
        occurredAt: now,
        businessDate: '2026-10-17',
        ticket: 1,
      },
    ])
  })

  it('numbers the tickets of the business date in sequence', async () => {
    const order: CreateOrderInput = {
      origin: 'whatsapp',
      items: [{ dishId: 'frango', size: 'medium', quantity: 1 }],
    }

    const first = await useCase.execute(order)
    const second = await useCase.execute(order)

    expect([first.ticket, second.ticket]).toEqual([1, 2])
  })

  it('gives the ticket back when the order is rejected', async () => {
    const order: CreateOrderInput = {
      origin: 'counter',
      items: [{ dishId: 'frango', size: 'medium', quantity: 1 }],
    }

    await expect(
      useCase.execute({ ...order, customerName: 'x'.repeat(61) }),
    ).rejects.toBeInstanceOf(OrderInvalidCustomerNameError)
    const accepted = await useCase.execute(order)

    expect(accepted.ticket).toBe(1)
    expect(await repositories.orders.findById(accepted.id)).not.toBeNull()
  })

  it('rejects an order when the day has no daily menu', async () => {
    clock.set('2026-10-18T15:00:00Z')

    await expect(
      useCase.execute({
        origin: 'counter',
        items: [{ dishId: 'frango', size: 'medium', quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(OrderWithoutDailyMenuError)
  })

  it('rejects dishes that are inactive or out of the daily menu', async () => {
    const created = useCase.execute({
      origin: 'counter',
      items: [
        { dishId: 'frango', size: 'medium', quantity: 1 },
        { dishId: 'bife', size: 'medium', quantity: 1 },
        { dishId: 'lasanha', size: 'medium', quantity: 1 },
      ],
    })

    await expect(created).rejects.toBeInstanceOf(OrderDishUnavailableError)
    await expect(created).rejects.toMatchObject({
      message: 'Dishes bife, lasanha are not available today',
    })
    expect(eventBus.published).toEqual([])
  })

  it('rejects inactive or unknown adjustments', async () => {
    await expect(
      useCase.execute({
        origin: 'counter',
        items: [
          {
            dishId: 'frango',
            size: 'medium',
            quantity: 1,
            adjustmentIds: ['sem-farofa', 'sem-feijao', 'sem-salada'],
          },
        ],
      }),
    ).rejects.toMatchObject(new AdjustmentUnavailableError(['sem-feijao', 'sem-salada']))
  })

  it('rejects a size without a current price', async () => {
    await expect(
      useCase.execute({
        origin: 'counter',
        items: [{ dishId: 'frango', size: 'large', quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(OrderSizeNotPricedError)
  })
})
