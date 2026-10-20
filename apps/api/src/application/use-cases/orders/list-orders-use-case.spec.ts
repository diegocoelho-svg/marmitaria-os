import { beforeEach, describe, expect, it } from 'vitest'
import { ListOrdersUseCase } from '@/application/use-cases/orders/list-orders-use-case'
import { OrderEntity } from '@/domain/entities/order-entity'
import { LocalDateVO } from '@/domain/value-objects/local-date-vo'
import { MoneyVO } from '@/domain/value-objects/money-vo'
import { OrderItemVO } from '@/domain/value-objects/order-item-vo'
import { TicketNumberVO } from '@/domain/value-objects/ticket-number-vo'
import { FakeOrderRepository } from '@test/fakes/fake-repositories'
import { FakeClock } from '@test/fakes/fake-services'

describe('ListOrdersUseCase', () => {
  let orders: FakeOrderRepository
  let clock: FakeClock
  let useCase: ListOrdersUseCase

  const createOrder = async (id: string, businessDate: string, ticket: number) => {
    const order = OrderEntity.create({
      id,
      businessDate: LocalDateVO.parse(businessDate),
      ticket: TicketNumberVO.of(ticket),
      origin: 'counter',
      items: [
        OrderItemVO.create({
          dishId: 'frango',
          dishName: 'Frango grelhado',
          size: 'medium',
          unitPrice: MoneyVO.fromCents(2500),
          quantity: 1,
        }),
      ],
      now: new Date(`${businessDate}T15:00:00Z`),
    })
    await orders.create(order)

    return order
  }

  beforeEach(async () => {
    orders = new FakeOrderRepository()
    clock = new FakeClock(new Date('2026-10-18T02:00:00Z'))
    useCase = new ListOrdersUseCase(orders, clock)

    await createOrder('order-2', '2026-10-17', 2)
    await createOrder('order-1', '2026-10-17', 1)
    await createOrder('order-3', '2026-10-18', 1)
  })

  it('lists the orders of the current business day by ticket', async () => {
    const output = await useCase.execute({})

    expect(output.map((order) => order.id)).toEqual(['order-1', 'order-2'])
  })

  it('lists the orders of a given day', async () => {
    const output = await useCase.execute({ date: '2026-10-18' })

    expect(output.map((order) => order.id)).toEqual(['order-3'])
  })

  it('keeps only the requested statuses', async () => {
    const started = await createOrder('order-4', '2026-10-17', 3)
    started.start(clock.now())
    await orders.update(started, 'received')

    const output = await useCase.execute({ status: ['preparing', 'ready'] })

    expect(output).toMatchObject([{ id: 'order-4', status: 'preparing' }])
  })
})
